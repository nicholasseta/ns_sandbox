/**
 * Module Description
 *
 * Version			Date			Author				Remarks
 * 1.00				04 Nov 2019		Doug Humberd		Scheduled Script that updates the Consolidated Exchange Rate records for the next period
 * 													    The script will only update records where the next period is the same as the current month/year
 *
 */
 
 
 /**
 * Constants
 */



 /**
 * Global Variables
 */



/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord recordType
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_updcer_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}


/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function is_updcer_updConsolidatedExchRates(type) {
	
	nlapiLogExecution('DEBUG', 'is_updcer_updConsolidatedExchRates', 'START');
	
	// Initialize variables
	var minRecId = 0;
	var countUpdRecs = 0;
	
	//Calculate first of current month
	var today = new Date();
	today.setDate(1);
	var firstOfMonth = nlapiDateToString(today, 'date');
	nlapiLogExecution('DEBUG', 'First Of Month', firstOfMonth);
	
	//Calculate first of previous month
	var last = new Date();
	last.setMonth(last.getMonth() - 1);
	last.setDate(1);
	var firstOfLastMonth = nlapiDateToString(last, 'date');
	nlapiLogExecution('DEBUG', 'First Of Last Month', firstOfLastMonth);
	
	var ucerCERIds = is_updcer_getChgdConsExchRateIds(minRecId, firstOfMonth);
	var count = 0;
	var cerId;
	
	while (ucerCERIds && ucerCERIds.length > 0){
		
		// Loop through the results and update them
		is_updcer_scheduledBatch(ucerCERIds, function (ucerCERId) {
			try{
				// Initialize variables
				cerId = ucerCERId.getValue('internalid');
				var currPdFromSubsidiary = ucerCERId.getValue('fromsubsidiary');
				var currPdToSubsidiary = ucerCERId.getValue('tosubsidiary');
				var currPdCurrRate = ucerCERId.getValue('currentrate');
				var currPdAvgRate = ucerCERId.getValue('averagerate');
				var currPdHistRate = ucerCERId.getValue('historicalrate');
				
				//if (cerId == '13428'){//TEST ID to control amount of logging - TO BE REMOVED
					//nlapiLogExecution('DEBUG', 'Running UCER SS for cerId:', cerId);
					//nlapiLogExecution('DEBUG', 'From Subsidiary: ' + currPdFromSubsidiary, 'To Subsidiary: ' + currPdToSubsidiary);
					//nlapiLogExecution('DEBUG', 'Current Rate for: ' + firstOfMonth, currPdCurrRate);
					//nlapiLogExecution('DEBUG', 'Average Rate for: ' + firstOfMonth, currPdAvgRate);
					//nlapiLogExecution('DEBUG', 'Historical Rate for: ' + firstOfMonth, currPdHistRate);
				//}
				
				
				//Get the internal id for the current 'From Subsidiary'
			    var fromSubsearch = getSubsidiaryID(currPdFromSubsidiary);
			    
			    if (fromSubsearch){
			    	
			    	for (var x = 0; x < fromSubsearch.length; x++){
			    		
			    		var fromSubId = fromSubsearch[x].getValue('internalid');
			    		var fromSubName = fromSubsearch[x].getValue('namenohierarchy');
			    		
			    		//if (cerId == '13428'){//TEST ID to control amount of logging - TO BE REMOVED
			    			//nlapiLogExecution('DEBUG', 'SUB SEARCH From Subsidiary ID', fromSubId);
			    			//nlapiLogExecution('DEBUG', 'SUB SEARCH From Name', fromSubName);
			    		//}
			    		
			    		if (fromSubName == currPdFromSubsidiary){
			    			currFromSubId = fromSubId;
			    			break;
			    		}
			    		
			    	}//End for x loop
			    	
			    	//if (cerId == '13428'){//TEST ID to control amount of logging - TO BE REMOVED
			    		nlapiLogExecution('DEBUG', 'Current From Subsidiary Id', currFromSubId);
			    	//}
			    	
			    }//End if (fromSubsearch)

			    
			    //Get the internal id for the current 'To Subsidiary'
			    var toSubsearch = getSubsidiaryID(currPdToSubsidiary);
			    
			    if (toSubsearch){
			    	
			    	for (var y = 0; y < fromSubsearch.length; y++){
			    		
			    		var toSubId = toSubsearch[y].getValue('internalid');
			    		var toSubName = toSubsearch[y].getValue('namenohierarchy');
			    		
			    		//if (cerId == '13428'){//TEST ID to control amount of logging - TO BE REMOVED
			    			//nlapiLogExecution('DEBUG', 'SUB SEARCH To Subsidiary ID', toSubId);
			    			//nlapiLogExecution('DEBUG', 'SUB SEARCH To Name', toSubName);
			    		//}
			    		
			    		if (toSubName == currPdToSubsidiary){
			    			currToSubId = toSubId;
			    			break;
			    		}
			    		
			    	}//End for y loop
			    	
			    	//if (cerId == '13428'){//TEST ID to control amount of logging - TO BE REMOVED
			    		nlapiLogExecution('DEBUG', 'Current To Subsidiary Id', currToSubId);
			    	//}
			    	
			    }//End if (fromSubsearch)
				
			    //Get values from previous consolidated exch rate record
			    var searchresults = getPreviousCERrecord(firstOfLastMonth, currFromSubId, currToSubId);
				
			    if (searchresults){
			    	
			    	for (var i = 0; i < searchresults.length; i++){
			    		
			    		var prevCerId = searchresults[i].getValue('internalid');
			    		var prevPeriodStartDate = searchresults[i].getValue('periodstartdate');
			    		var prevPdCurrRate = searchresults[i].getValue('currentrate');
			    		var prevPdAvgRate = searchresults[i].getValue('averagerate');
			    		var prevPdHistRate = searchresults[i].getValue('historicalrate');
			    		
			    		//if (cerId == '13428'){//TEST ID to control amount of logging - TO BE REMOVED
			    			//nlapiLogExecution('DEBUG', 'SEARCH Previous Pd - Cons Exch Rate ID', prevCerId);
			    			//nlapiLogExecution('DEBUG', 'SEARCH Previous Pd - Current Exch Rate', prevPdCurrRate);
			    			//nlapiLogExecution('DEBUG', 'SEARCH Previous Pd - Average Exch Rate', prevPdAvgRate);
			    			//nlapiLogExecution('DEBUG', 'SEARCH Previous Pd - Historical Exch Rate', prevPdHistRate);
			    			//nlapiLogExecution('DEBUG', 'SEARCH Previous Pd - Period Start Date', prevPeriodStartDate);
			    		//}
			    		
			    	}
			    	
			    }//End if (searchresults)
			    
			    
			    //Identify any differences, and update rates if found
			    if (currPdCurrRate != prevPdCurrRate || currPdAvgRate != prevPdAvgRate || currPdHistRate != prevPdHistRate){
			    	
			    	//if (cerId == '13428'){//TEST ID to control amount of logging - TO BE REMOVED
			    		//Update Current Consolidated Exch Rate Table with rate values
			    		nlapiLogExecution('DEBUG', 'Update CER Record: ' + cerId, prevPdCurrRate + ' | ' + prevPdAvgRate + ' | ' + prevPdHistRate);
			    		nlapiSubmitField('consolidatedexchangerate', cerId, ['currentrate', 'averagerate', 'historicalrate'], [prevPdCurrRate, prevPdAvgRate, prevPdHistRate]);
			    		countUpdRecs = countUpdRecs + 1;
			    	//}
			    	
			    }
				
				count = count + 1;
				
			} catch ( e ) {
				var errorMessage = '';
				if (e instanceof nlobjError) {
					if (e.getCode() == 'SSS_USAGE_LIMIT_EXCEEDED') {
						nlapiLogExecution('debug','Usage Exceeded on EmpId:',empId);
						var state = nlapiYieldScript();
						if (state.status == 'FAILURE') {
								nlapiLogExecution("ERROR","Failed to reschedule script, exiting: Reason = "+state.reason + " / Size = "+ state.size + " / Info = "+ state.information);
								throw "Failed to reschedule script";
						} else if ( state.status == 'RESUME' ) {
							nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
						}
						startUsage = nlapiGetContext().getRemainingUsage();
					} else if (e.getCode() == 'RCRD_DSNT_EXIST') {
						nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', cerId );
					} else {
						errorMessage = e.getCode() + '\n' + e.getDetails();
						nlapiLogExecution( 'DEBUG', 'system error', errorMessage );
					}
				} else {
					errorMessage = e.toString();
					nlapiLogExecution( 'DEBUG', 'unexpected error', errorMessage );
				}
			}
		});
		
		// Check for any additional records
		minRecId = cerId;
		nlapiLogExecution('DEBUG', 'minRecId after loop', minRecId);
		ucerCERIds = is_updcer_getChgdConsExchRateIds(minRecId, firstOfMonth);
		
	}//End while loop
	
	nlapiLogExecution('DEBUG', 'Count of Search Results', count);
	nlapiLogExecution('DEBUG', 'Count of CER Records Updated', countUpdRecs);
	
}


/**
 * Processes each element of an array, checks remaining governance units 
 * and reschedules the script, if needed.
 * 
 * @appliedtorecord invoice
 * 
 * @param {Array} arr: array to be processed by the script
 * @param {Array} proc: function to be used to process each element of the array
 * @returns {Void}
 */
function is_updcer_scheduledBatch(arr, proc) {

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
		//nlapiLogExecution('debug', 'End Usage / Run Usage', endUsage + ' / ' + runUsage);
		if (maxUsage < runUsage) maxUsage = runUsage;
		if (endUsage < (maxUsage + 40)){
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


/**
 * Returns a list of Consolidated Exchange Rate Records to be processed
 * 
 * @appliedtorecord consolidatedexchangerate
 * 
 * @returns {nlobjSearch}
 */
function is_updcer_getChgdConsExchRateIds(minRecId, period) {
	// Define filters
	//var filters = new Array();
	//filters.push(new nlobjSearchFilter('periodstartdate', null, 'on', period));
	//filters.push(new nlobjSearchFilter('formulatext: {autocalc}', null, 'isnotempty', ''));
	//filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', minRecId));
	var filters = [
	               ["periodstartdate","on",period],
	               "AND", 
	               ["formulatext: {autocalc}","isnotempty",""], 
	               "AND", 
	               ["internalidnumber","greaterthan",minRecId]
	            ];
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['2937', '2938', '2939', '2940']));//TEMPORARY FILTER FOR TESTING

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('periodstartdate', null, null));
	columns.push(new nlobjSearchColumn('fromsubsidiary', null, null));
	columns.push(new nlobjSearchColumn('tosubsidiary', null, null));
	columns.push(new nlobjSearchColumn('currentrate', null, null));
	columns.push(new nlobjSearchColumn('averagerate', null, null));
	columns.push(new nlobjSearchColumn('historicalrate', null, null));
	columns[0].setSort(false /* ascending */);

	return nlapiSearchRecord('consolidatedexchangerate', null, filters, columns);
}





function getSubsidiaryID(subsidiary){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('name', null, 'contains', subsidiary));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('namenohierarchy', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('subsidiary', null, filters, columns);
	  
	// Return
	return results;
	
}





function getPreviousCERrecord(firstOfLastMonth, currFromSubId, currToSubId){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('periodstartdate', null, 'on', firstOfLastMonth));
	filters.push(new nlobjSearchFilter('fromsubsidiary', null, 'anyof', currFromSubId));
	filters.push(new nlobjSearchFilter('tosubsidiary', null, 'anyof', currToSubId));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('periodstartdate', null, null));
 	columns.push(new nlobjSearchColumn('currentrate', null, null));
	columns.push(new nlobjSearchColumn('averagerate', null, null));
	columns.push(new nlobjSearchColumn('historicalrate', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('consolidatedexchangerate', null, filters, columns);
	  
	// Return
	return results;
	
}





function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
} 



