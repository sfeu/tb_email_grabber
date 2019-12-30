function onCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Item created successfully");
  }
};

browser.menus.create({
  id: "saveAsCSV_action",
  title:browser.i18n.getMessage("save_as_csv"), 
  contexts: ["folder_pane"]
}, onCreated);


browser.menus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "saveAsCSV_action":
      exportAllCSV();
      break;
  }
})

function exportAllCSV() {

  tabsQueryInfo = {
    active: true,
    currentWindow: true
  }

  messageProperties = {
  }

  var double_check = {};

  function fetchSenders(messages){
    var arr = [];

    for (i in messages){
      const regex = /^\"*([^\"]*)\"*.<(.+)>$/gm;
      const str = messages[i].author; 
      let m;

      while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
          regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {

          switch(groupIndex) {
            case 1: // name
              name = match;
              break;

            case 2: // email
              email = match.toLowerCase();
              break;
          }
        });

        if  (!double_check.hasOwnProperty(email)) {
          arr.push({
            name: name,
            email: email
          });
          console.log("name:"+name+" email:"+email);
          double_check[email]=1;
        } else {
          double_check[email]=double_check[email]+1; // TBD add count to CSV
        }
      }
    }
    // browser.messages.update(messages[i].id, messageProperties)
    return arr;
  }

  browser.mailTabs.query(tabsQueryInfo).then(async (tabs) => {
    //Gets the current displayed folder on the active tab on the active window
    folder = tabs[0].displayedFolder;

    let page = await browser.messages.list(folder);
    var results = await fetchSenders(page.messages)

    while (page.id) {
      page = await browser.messages.continueList(page.id);
      await results.push(...fetchSenders(page.messages));
    }
    console.log(results);

    var csv = await convertArrayOfObjectsToCSV({data:results,columnDelimiter:'\t'});
console.log(csv);
    var blob = new Blob([csv], {type: "text/csv;charset=utf-8"})

    //browser.downloads.download({url:URL.createObjectURL(blob),filename:"test.csv",saveAs:true});


  })

}

// Functions taken from https://halistechnology.com/2015/05/28/use-javascript-to-export-your-data-as-csv/

function convertArrayOfObjectsToCSV(args) {  
  var result, ctr, keys, columnDelimiter, lineDelimiter, data;

  data = args.data;
  if (data == null || !data.length) {
    return null;
  }

  columnDelimiter = args.columnDelimiter || ',';
  lineDelimiter = args.lineDelimiter || '\n';

  keys = Object.keys(data[0]);

  result = '';
  result += keys.join(columnDelimiter);
  result += lineDelimiter;

  data.forEach(function(item) {
    ctr = 0;
    keys.forEach(function(key) {
      if (ctr > 0) result += columnDelimiter;

      result += item[key];
      ctr++;
    });
    result += lineDelimiter;
  });

  return result;
}


