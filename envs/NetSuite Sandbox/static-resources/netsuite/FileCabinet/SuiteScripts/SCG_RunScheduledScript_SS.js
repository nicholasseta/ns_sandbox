/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       15 Aug 2018     Doug Humberd     Runs the commands in the commandList constant
 *
 */

const commandList = [
'286991',
'468301',
'1802848',
'1802849',
'1749015',
'54513',
'1842296',
'596758',
'2189373',
'54477',
'1938641',
'280058',
'473605',
'2215342',
'596761',
'54409',
'380254',
'630851',
'1998599',
'1141634',
'1812882',
'1909810',
'2006731',
'2012260',
'54478',
'179112',
'1997797',
'291298',
'1856912',
'305349',
'1751270',
'54495',
'97631',
'380253',
'500789',
'1820907',
'2067341',
'193025',
'305347',
'1786802',
'1833842',
'97632',
'309775',
'928559',
'1748604',
'2035755',
'380252',
'54418',
'1786803'
]

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
      var projectRec = nlapiLoadRecord('job',command);
      var periodLineId = projectRec.findLineItemValue('percentcompleteoverride', 'period', '88');
      if (periodLineId > 0) {
        projectRec.removeLineItem('percentcompleteoverride', periodLineId);
	    nlapiSubmitRecord(projectRec);
      }
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