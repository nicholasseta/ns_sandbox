/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       23 May 2022     Doug Humberd     Runs the commands in the commandList constant
 *
 */

const commandList = [
"approveImportedPOs(13107059,'purchaseorder'); nlapiLogExecution('DEBUG','13107059','');",
"approveImportedPOs(13107058,'purchaseorder'); nlapiLogExecution('DEBUG','13107058','');",
"approveImportedPOs(13107057,'purchaseorder'); nlapiLogExecution('DEBUG','13107057','');",
"approveImportedPOs(13107056,'purchaseorder'); nlapiLogExecution('DEBUG','13107056','');",
"approveImportedPOs(13107055,'purchaseorder'); nlapiLogExecution('DEBUG','13107055','');",
"approveImportedPOs(13107054,'purchaseorder'); nlapiLogExecution('DEBUG','13107054','');",
"approveImportedPOs(13107053,'purchaseorder'); nlapiLogExecution('DEBUG','13107053','');",
"approveImportedPOs(13107052,'purchaseorder'); nlapiLogExecution('DEBUG','13107052','');",
"approveImportedPOs(13107051,'purchaseorder'); nlapiLogExecution('DEBUG','13107051','');",
"approveImportedPOs(13107050,'purchaseorder'); nlapiLogExecution('DEBUG','13107050','');",
"approveImportedPOs(13107049,'purchaseorder'); nlapiLogExecution('DEBUG','13107049','');",
"approveImportedPOs(13107048,'purchaseorder'); nlapiLogExecution('DEBUG','13107048','');",
"approveImportedPOs(13107047,'purchaseorder'); nlapiLogExecution('DEBUG','13107047','');",
"approveImportedPOs(13107046,'purchaseorder'); nlapiLogExecution('DEBUG','13107046','');",
"approveImportedPOs(13107045,'purchaseorder'); nlapiLogExecution('DEBUG','13107045','');",
"approveImportedPOs(13107044,'purchaseorder'); nlapiLogExecution('DEBUG','13107044','');",
"approveImportedPOs(13107043,'purchaseorder'); nlapiLogExecution('DEBUG','13107043','');",
"approveImportedPOs(13107042,'purchaseorder'); nlapiLogExecution('DEBUG','13107042','');",
"approveImportedPOs(13107041,'purchaseorder'); nlapiLogExecution('DEBUG','13107041','');",
"approveImportedPOs(13106890,'purchaseorder'); nlapiLogExecution('DEBUG','13106890','');",
"approveImportedPOs(13106889,'purchaseorder'); nlapiLogExecution('DEBUG','13106889','');",
"approveImportedPOs(13106888,'purchaseorder'); nlapiLogExecution('DEBUG','13106888','');",
"approveImportedPOs(13106887,'purchaseorder'); nlapiLogExecution('DEBUG','13106887','');",
"approveImportedPOs(13106886,'purchaseorder'); nlapiLogExecution('DEBUG','13106886','');",
"approveImportedPOs(13106885,'purchaseorder'); nlapiLogExecution('DEBUG','13106885','');",
"approveImportedPOs(13106884,'purchaseorder'); nlapiLogExecution('DEBUG','13106884','');",
"approveImportedPOs(13106883,'purchaseorder'); nlapiLogExecution('DEBUG','13106883','');",
"approveImportedPOs(13106882,'purchaseorder'); nlapiLogExecution('DEBUG','13106882','');",
"approveImportedPOs(13106881,'purchaseorder'); nlapiLogExecution('DEBUG','13106881','');",
"approveImportedPOs(13106880,'purchaseorder'); nlapiLogExecution('DEBUG','13106880','');",
"approveImportedPOs(13106879,'purchaseorder'); nlapiLogExecution('DEBUG','13106879','');",
"approveImportedPOs(13106878,'purchaseorder'); nlapiLogExecution('DEBUG','13106878','');",
"approveImportedPOs(13106877,'purchaseorder'); nlapiLogExecution('DEBUG','13106877','');",
"approveImportedPOs(13106876,'purchaseorder'); nlapiLogExecution('DEBUG','13106876','');",
"approveImportedPOs(13106875,'purchaseorder'); nlapiLogExecution('DEBUG','13106875','');",
"approveImportedPOs(13106874,'purchaseorder'); nlapiLogExecution('DEBUG','13106874','');",
"approveImportedPOs(13106873,'purchaseorder'); nlapiLogExecution('DEBUG','13106873','');",
"approveImportedPOs(13106872,'purchaseorder'); nlapiLogExecution('DEBUG','13106872','');",
"approveImportedPOs(13106871,'purchaseorder'); nlapiLogExecution('DEBUG','13106871','');",
"approveImportedPOs(13106870,'purchaseorder'); nlapiLogExecution('DEBUG','13106870','');",
"approveImportedPOs(13106869,'purchaseorder'); nlapiLogExecution('DEBUG','13106869','');",
"approveImportedPOs(13106868,'purchaseorder'); nlapiLogExecution('DEBUG','13106868','');",
"approveImportedPOs(13106867,'purchaseorder'); nlapiLogExecution('DEBUG','13106867','');",
"approveImportedPOs(13106866,'purchaseorder'); nlapiLogExecution('DEBUG','13106866','');",
"approveImportedPOs(13106865,'purchaseorder'); nlapiLogExecution('DEBUG','13106865','');",
"approveImportedPOs(13106864,'purchaseorder'); nlapiLogExecution('DEBUG','13106864','');",
"approveImportedPOs(13106863,'purchaseorder'); nlapiLogExecution('DEBUG','13106863','');",
"approveImportedPOs(13106862,'purchaseorder'); nlapiLogExecution('DEBUG','13106862','');",
"approveImportedPOs(13106861,'purchaseorder'); nlapiLogExecution('DEBUG','13106861','');",
"approveImportedPOs(13106860,'purchaseorder'); nlapiLogExecution('DEBUG','13106860','');",
"approveImportedPOs(13106859,'purchaseorder'); nlapiLogExecution('DEBUG','13106859','');",
"approveImportedPOs(13106858,'purchaseorder'); nlapiLogExecution('DEBUG','13106858','');",
"approveImportedPOs(13106857,'purchaseorder'); nlapiLogExecution('DEBUG','13106857','');",
"approveImportedPOs(13106856,'purchaseorder'); nlapiLogExecution('DEBUG','13106856','');",
"approveImportedPOs(13106855,'purchaseorder'); nlapiLogExecution('DEBUG','13106855','');",
"approveImportedPOs(13106854,'purchaseorder'); nlapiLogExecution('DEBUG','13106854','');",
"approveImportedPOs(13106853,'purchaseorder'); nlapiLogExecution('DEBUG','13106853','');",
"approveImportedPOs(13106852,'purchaseorder'); nlapiLogExecution('DEBUG','13106852','');",
"approveImportedPOs(13106851,'purchaseorder'); nlapiLogExecution('DEBUG','13106851','');",
"approveImportedPOs(13106850,'purchaseorder'); nlapiLogExecution('DEBUG','13106850','');",
"approveImportedPOs(13106849,'purchaseorder'); nlapiLogExecution('DEBUG','13106849','');",
"approveImportedPOs(13106848,'purchaseorder'); nlapiLogExecution('DEBUG','13106848','');",
"approveImportedPOs(13106847,'purchaseorder'); nlapiLogExecution('DEBUG','13106847','');",
"approveImportedPOs(13106846,'purchaseorder'); nlapiLogExecution('DEBUG','13106846','');",
"approveImportedPOs(13106845,'purchaseorder'); nlapiLogExecution('DEBUG','13106845','');",
"approveImportedPOs(13106844,'purchaseorder'); nlapiLogExecution('DEBUG','13106844','');",
"approveImportedPOs(13106843,'purchaseorder'); nlapiLogExecution('DEBUG','13106843','');",
"approveImportedPOs(13106842,'purchaseorder'); nlapiLogExecution('DEBUG','13106842','');",
"approveImportedPOs(13106841,'purchaseorder'); nlapiLogExecution('DEBUG','13106841','');",
"approveImportedPOs(13106840,'purchaseorder'); nlapiLogExecution('DEBUG','13106840','');",
"approveImportedPOs(13106839,'purchaseorder'); nlapiLogExecution('DEBUG','13106839','');",
"approveImportedPOs(13106838,'purchaseorder'); nlapiLogExecution('DEBUG','13106838','');",
"approveImportedPOs(13106837,'purchaseorder'); nlapiLogExecution('DEBUG','13106837','');"
]


function approveImportedPOs(TRAN_ID, recType){
	
	//var updRec = nlapiLoadRecord('journalentry', TRAN_ID, {recordmode: 'dynamic'});
	var updRec = nlapiLoadRecord(recType, TRAN_ID, {recordmode: 'dynamic'});
	
	//var runCount = 0;

	
	//if (recType == 'revenuearrangement'){
	
	updRec.setFieldValue('custbody_scg_po_appvl_current_state', '11');//Approved
	updRec.setFieldValue('approvalstatus', '2');//Approved
	
		
	/*
	
	var lineCount = updRec.getLineItemCount('revenueelement');
    
    for (var x = 1; x <= lineCount; x++){
    	
    	var endUser = updRec.getLineItemValue('revenueelement', 'custcol_end_user_ra', x);
    	var name = updRec.getLineItemValue('revenueelement', 'customer', x);
    	
    	if (isEmpty(endUser)){
    		
    		//nlapiLogExecution('DEBUG', 'End User (RA) Empty', 'Update End User (RA) Line: ' + x);
    		
    		updRec.selectLineItem('revenueelement', x);
    		//updRec.setLineItemValue('revenueelement', 'custcol_end_user_ra', x, name);
    		updRec.setCurrentLineItemValue('revenueelement', 'custcol_end_user_ra', name);
    		updRec.commitLineItem('revenueelement', true);
    		
    	}
		
	}//End for x loop
		
	//}
	
	*/
	
	
	
    /*
    
	if (recType == 'journalentry'){
		
		var lineCount = updRec.getLineItemCount('line');
	    
	    for (var i = 1; i <= lineCount; i++){
	    	
	    	var accttype = updRec.getLineItemValue('line', 'accounttype', i);
	    	
	    	if (accttype != 'Income'){
	    		continue;
	    	}
	    	
	    	var endUser = updRec.getLineItemValue('line', 'custcol_end_user_ra', i);
	    	var name = updRec.getLineItemValue('line', 'entity', i);
	    	//nlapiLogExecution('DEBUG', 'Name Line ' + i, name);
	    	
	    	if (isEmpty(name) || !isEmpty(endUser)){
	    		continue;
	    	}
	    	
	    	var customerCheck = chkIfCustomer(name);
	    	
	    	if (customerCheck && isEmpty(endUser)){
	    		
	    		//nlapiLogExecution('DEBUG', 'Income Account Found, End User (ra) Empty', 'Update End User (ra) Line: ' + i);
	    		
	    		updRec.selectLineItem('line', i);
	    		//updRec.setLineItemValue('line', 'custcol_end_user_ra', i, name);
	    		updRec.setCurrentLineItemValue('line', 'custcol_end_user_ra', name);
	    		updRec.commitLineItem('line', true);
	    		
	    		runCount = Number(runCount) + 1;
	    		
	    	}
	    	
	    	if (runCount == 1000){
	    		nlapiLogExecution('DEBUG', 'Run Count: ' + runCount, 'BREAK');
	    		break;
	    	}
			
		}//End for i loop

	    
	}
	
	*/

	
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




function chkIfCustomer(name){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', name));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	  
	// Get results
	var currResults = nlapiSearchRecord('customer', null, filters, columns);
	  
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
          //nlapiLogExecution('debug','Usage Exceeded before Count - Id',i + ' ' + TRAN_ID);
          nlapiLogExecution('debug','Usage Exceeded before Count - Id', '');
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