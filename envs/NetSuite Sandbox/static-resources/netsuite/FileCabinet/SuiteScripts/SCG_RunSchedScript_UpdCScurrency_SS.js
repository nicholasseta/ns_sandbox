/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       14 Mar 2019     Doug Humberd     Runs the commands in the commandList constant
 *
 */

const commandList = [
"updCScurrency(203424,'2'); nlapiLogExecution('debug','203424','');",
"updCScurrency(203424,'2'); nlapiLogExecution('debug','203424','');",
"updCScurrency(203424,'2'); nlapiLogExecution('debug','203424','');"
]


function updCScurrency(TRAN_ID, CURRENCY){
	
	var updRec = nlapiLoadRecord('cashsale', TRAN_ID, {recordmode: 'dynamic'});
	
	updRec.setFieldValue('currency', CURRENCY);
    
    //var lineCount = updRec.getLineItemCount('item');
    
    //for (var i = 1; i <= lineCount; i++){
		
    	//updRec.selectLineItem('item', i);
    	//updRec.setCurrentLineItemValue('item', 'custcol_rev_rec_start_date', CURRENCY);
    	//updRec.commitLineItem('item', false);
		
	//}
    
    nlapiSubmitRecord(updRec);
	
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
          nlapiLogExecution('debug','Usage Exceeded before Count - Id',i + ' ' + custId);
        } else if (e.getCode() == 'RCRD_DSNT_EXIST') {
          nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', custId );
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