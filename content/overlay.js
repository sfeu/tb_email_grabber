//
// File picker dialogue function that is called from XUL
//

function saveAsCSV() {
	const nsIFilePicker = Components.interfaces.nsIFilePicker;

	var fp = Components.classes["@mozilla.org/filepicker;1"]
	           .createInstance(nsIFilePicker);
	fp.init(window, "Save CVS as", nsIFilePicker.modeSave);
	fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
	fp.open(function (rv) {
		if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
    			var result = convertArrayOfObjectsToCSV({data:extractSenders(),columnDelimiter:'\t'});
		
			// write file 
			//
		//		OS.File.writeAtomic(fp.file.path, result,{tmpPath: "file.txt.tmp"}); 
			Components.utils.import("resource://gre/modules/NetUtil.jsm");
			Components.utils.import("resource://gre/modules/FileUtils.jsm");

			// You can also optionally pass a flags parameter here. It defaults to
			// FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE;
			var ostream = FileUtils.openSafeFileOutputStream(fp.file);

			var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
				      createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
			converter.charset = "UTF-8";
			var istream = converter.convertToInputStream(result);

			// The last argument (the callback) is optional.
			NetUtil.asyncCopy(istream, ostream, function(status) {
			  if (!Components.isSuccessCode(status)) {
			    // Handle error!
			    return;
			  }
			});	
 		 }
	});
}

function extractSenders() {
	var msgHeaderParser = Components.classes["@mozilla.org/messenger/headerparser;1"]
                      .createInstance(Components.interfaces.nsIMsgHeaderParser);

	var arr = [];
	var double_check = {};

	for (let msgHdr in fixIterator(gFolderDisplay.displayedFolder.messages, Components.interfaces.nsIMsgDBHdr)) {
		var email =  msgHeaderParser.extractHeaderAddressMailboxes(msgHdr.author).
			toLowerCase(); 
		if  (!double_check.hasOwnProperty(email)) { 
		  	arr.push({
				name: msgHeaderParser.extractHeaderAddressNames(msgHdr.author),
        			email: email
    		  	});
			double_check[email]=1;
		} else {
			double_check[email]=double_check[email]+1; // TBD add count to CSV
		}

	}
	return arr;
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


// Outdated functions
//
// just as a reference

	/* window.addEventListener("load", function(e) { 
	startup(); 
}, false);

window.setInterval(
	function() {
		startup(); 
	}, 60000); //update date every minute

function startup() {
	var myPanel = document.getElementById("my-panel");
	var date = new Date();
	var day = date.getDay();
	var dateString = date.getFullYear() + "." + (date.getMonth()+1) + "." + date.getDate();
	myPanel.label = "Date: " + dateString;
}
*/


