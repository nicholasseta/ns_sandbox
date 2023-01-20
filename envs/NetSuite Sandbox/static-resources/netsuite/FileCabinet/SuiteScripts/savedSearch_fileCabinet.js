
/**
 * Definition of the Scheduled script trigger point.
 *
 * @param {Object} scriptContext
 * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
 * @Since 2015.2
 */
 
//Load saved search
function execute(scriptContext) {
	
    var mySearch = search.load({
        id: 'customsearchcustomergeneralview_10_3'
       });
       
       log.debug('mySearch', mySearch);
       
       var columns = mySearch.columns;
       log.debug('mySearch', columns);
       log.debug('mySearch length', columns.length);
       
       //Creating arrays that will populate results
       var content = new Array();
       var cells = new Array();
       var headers = new Array();
       var temp = new Array();
       var x = 0;
       
       
       for(var i=0; i< columns.length; i++){
        headers[i] = columns[i].name;
        log.debug('col ',headers[i]);    
        
       } 
       
       content[x] =  headers;
       x =1;
       
       
       
       //Looping through the search results
       mySearch.run().each(function(result){
        log.debug('content',content);
        //looping through each columns
        for(var y=0; y< columns.length; y++){
         
            var searchResult = result.getValue({
             name: columns[y].name
            });
            temp[y] = searchResult;
            log.debug(temp[y],searchResult); 
  
           } 
       content[x] +=temp;
       x++; 
          return true; 
          });
       
       
        
        //Creating a string variable that will be used as CSV Content
        var contents='';
        
        for(var z =0; z<content.length;z++){
         contents +=content[z].toString() + '\n';
        }
      
       
       log.debug('contents',contents);
	
	//Variable for datetime
	var date = new Date();
	
	//Creation of file
		var fileObj = file.create({
		//To make each file unique and avoid overwriting, append date on the title
		name: 'Saved Search Result - ' + date.toLocaleDateString() +'.csv',
		fileType: file.Type.CSV,
		contents: contents,
		description: 'This is a CSV file.',
		encoding: file.Encoding.UTF8,
		folder: 5677226
		});
	
	//Save the CSV file
	var fileId = fileObj.save()
		log.debug('File ID...',fileId)
}

return {
    execute: execute
};