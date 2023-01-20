/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       30 Sep 2021     Doug Humberd     Runs the commands in the commandList constant
 *
 */

const commandList = [
"updNameJE(10085753); nlapiLogExecution('DEBUG','10085753','');",
"updNameJE(8604806); nlapiLogExecution('DEBUG','8604806','');"
]


function updNameJE(TRAN_ID){
	
	var arMigrationCust = '97';//Customer: 2 AR Migration Customer
	var apMigrationVend = '96';//Vendor: AP Migration Vendor
	
	var searchresults = getRecType(TRAN_ID);

	if (searchresults){
		var recType = searchresults[0].getValue('recordtype');
	}
	nlapiLogExecution('DEBUG', 'Transaction ID: ' + TRAN_ID, 'Record Type: ' + recType);
	
	
	//var updRec = nlapiLoadRecord('journalentry', TRAN_ID, {recordmode: 'dynamic'});
	var updRec = nlapiLoadRecord(recType, TRAN_ID, {recordmode: 'dynamic'});
	
	var lineCount = updRec.getLineItemCount('line');
    
    for (var i = 1; i <= lineCount; i++){
    	
    	var acct = updRec.getLineItemValue('line', 'account', i);
    	var name = updRec.getLineItemValue('line', 'entity', i);
    	
    	if ((acct == '339' || acct == '122' || acct == '1676' || acct == '2487') && isEmpty(name)){//Acounts: 12000, 12010, 12011, 12015
    		
    		nlapiLogExecution('DEBUG', 'AR Account Found: ' + acct, 'Update Name Line: ' + i);
    		
    		updRec.selectLineItem('line', i);
        	updRec.setCurrentLineItemValue('line', 'entity', arMigrationCust);
        	updRec.commitLineItem('line', false);
    		
    	}
    	
    	if (acct == '546' && isEmpty(name)){//Account: 20010
    		
    		nlapiLogExecution('DEBUG', 'AP Account Found: ' + acct, 'Update Name Line: ' + i);
    		
    		updRec.selectLineItem('line', i);
        	updRec.setCurrentLineItemValue('line', 'entity', apMigrationVend);
        	updRec.commitLineItem('line', false);
    		
    	}
		
	}//End for i loop
    
    nlapiSubmitRecord(updRec);
	
}



function getRecType(TRAN_ID){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', TRAN_ID));
	  
	// Define columns
	var columns = new Array();
	//columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('recordtype', null, null));
	  
	// Get results
	var currResults = nlapiSearchRecord('transaction', null, filters, columns);
	  
	// Return
	return currResults;
	
}



function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}



/**
 * Runs the commands in the commandList constant
 *
 * @returns {void}
 */
function runScheduledScript() {

  // Loop through the list of commands
  scheduledBatch(commandList, function (command) {
    try{
      // Run the command
      eval(command);
    } catch ( e ) {
      if (e instanceof nlobjError) {
        if (e.getCode() == 'SSS_USAGE_LIMIT_EXCEEDED') {
          nlapiLogExecution('debug','Usage Exceeded before Count - Id',i + ' ' + TRAN_ID);
        } else if (e.getCode() == 'RCRD_DSNT_EXIST') {
          nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', TRAN_ID );
        } else {
          nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
        }
      } else {
        nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
      }
    }
  });
}

/**
 * Processes each element of an array, checks remaining governance units
 * and reschedules the script, if needed.
 *
 * @param {Array} arr: array to be processed by the script
 * @param {Array} proc: function to be used to process each element of the array
 * @returns {void}
 */
function scheduledBatch(arr, proc) {

  // Initialize variables
  var maxUsage = 0;
  var startUsage = nlapiGetContext().getRemainingUsage();

  // Loop through the array
  for (var i in arr){
    // Process the current array value
    proc(arr[i], i, arr);

    // Update the percent complete value on the script status page
    if (nlapiGetContext().getExecutionContext() == "scheduled") nlapiGetContext().setPercentComplete( ((100*i)/arr.length ).toFixed(1));

    // Track governance and reschedule script, if needed
    var endUsage = nlapiGetContext().getRemainingUsage();
    var runUsage = startUsage - endUsage;
    if (maxUsage < runUsage) maxUsage = runUsage;
    if (endUsage < (maxUsage + 20)){
      var state = nlapiYieldScript();
      if (state.status == 'FAILURE') {
        nlapiLogExecution("ERROR","Failed to reschedule script, exiting: Reason = "+state.reason + " / Size = "+ state.size + " / Info = "+ state.information);
        throw "Failed to reschedule script";
      } else if ( state.status == 'RESUME' ) {
        nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
      }
      startUsage = nlapiGetContext().getRemainingUsage();
    } else {
      startUsage = endUsage;
    }
  }
}