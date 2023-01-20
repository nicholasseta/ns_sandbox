/**
 * Module Description
 *
 * Version			Date			Author				Remarks
 * 1.00				13 Apr 2020		Doug Humberd		Updates the Print Amount values on Invoices with > 150 lines
 *                                                      (This script mirrors the 'SCG_Invoice_UE_Print' Library triggered from SCG_Invoice_UE
 * 1.05             28 Apr 2020     Doug Humberd        Updated to test for scenarios when 'If incAcct = null'
 * 1.10             28 Apr 2020     Doug Humberd        Updated to include checks for Account 662
 * 1.15             13 Jul 2020     Doug Humberd        Updated to include additional subtotaling by taxcode
 *
 */
 
 
 /**
 * Constants
 */
const RECURR_SUBSCR_REV_ACCT = '661';//Account: Recurring Subscription (On-Prem Term License) Revenue
const SAAS_REVENUE_ACCT = '662';//Account: SaaS Revenue


 /**
 * Global Variables
 */
//var is_upa_context = nlapiGetContext();


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord recordType
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_upa_logError(e) {
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
function is_upa_updPrintAmt(type) {
	
	nlapiLogExecution('DEBUG', 'updPrintAmt', 'START');
	
	// Initialize variables
	var upaQueueIds = is_upa_getPrintAmtQueueIds();
	
	if (!upaQueueIds){
		nlapiLogExecution('DEBUG', 'No Transactions Found', 'EXIT');
	}
	
	// Loop through the results and update them
	is_upa_scheduledBatch(upaQueueIds, function (upaQueueId) {
		try{
			// Initialize variables
			var transId = upaQueueId.getValue('custrecord_scg_upa_transaction');
			
			nlapiLogExecution('DEBUG', 'Running UPA SS for transId:', transId);
			
			//var transRec = nlapiLoadRecord(transType, transId, {recordmode: 'dynamic'});
			var transRec = nlapiLoadRecord('invoice', transId);
			
			var itemCount = transRec.getLineItemCount('item');
			//nlapiLogExecution('DEBUG', 'itemCount', itemCount);
			
			
			var orderType = transRec.getFieldValue('custbody_so_ordertype');
		    var printExpanded = transRec.getFieldValue('custbody_expand_licenses_on_invoice');
		    var printCollapsed = false;
		    // Use custom print amount field
		    // Income Account = Recurring Subscriptions
		    // Order Type = Renewal
		    // Expand License on Invoice = False
		    nlapiLogExecution('DEBUG', 'orderType', orderType);
		    if (orderType == 3 && printExpanded === 'F') {
		      printCollapsed = true;
		    }

		    var arrProdFamTaxCode = [];
		    //var arrProdFamily = [];
		    //var arrProdDesc = [];
		    var arrProdAmt = [];
		    var arrLine = [];
			
			
			for (var i = 1; itemCount != 0 && i <= itemCount; i++){
				
				transRec.setLineItemValue('item', 'custcol_print_amount', i, '');
				
				var prodFamily = transRec.getLineItemValue('item', 'custcol_product_family', i);
			    var incAcct = transRec.getLineItemValue('item', 'custcol_ava_incomeaccount', i);
			    //nlapiLogExecution('DEBUG', 'incAcct', incAcct + ', ' + typeof incAcct);
			    var taxCode = transRec.getLineItemValue('item', 'taxcode', i);
			    //nlapiLogExecution('DEBUG', 'taxCode', taxCode);
			    
			    var concatProdFamTaxCode = prodFamily + '--' + taxCode;
			    nlapiLogExecution('DEBUG', 'Concatenate Prod Fam & Tax Code', concatProdFamTaxCode);
			    
			    //If incAcct = null, set to String Value so that Search does not fail.  Then set incAcctId to an invalid internal id (0) so that the script won't error later
			    if (incAcct == null){
			    	nlapiLogExecution('DEBUG', 'incAcct null', 'NULL');
			    	incAcct = 'IncAcct Not Found';
			    	var incAcctId = 0;
			    }
				
			    //Get the internal id for the 'Income Account'
			    var IncAcctSearch = getIncAcctID(incAcct);
				
			    if (IncAcctSearch){
			      	var incAcctId = IncAcctSearch[0].getValue('internalid');
			      	var incAcctName = IncAcctSearch[0].getValue('name');
			      	//nlapiLogExecution('DEBUG', 'INC ACCT SEARCH Income Acct ID', incAcctId);
			      	//nlapiLogExecution('DEBUG', 'INC ACCT SEARCH Income Acct Name', incAcctName);
			    }//End if (fromSubsearch)
				
			    //if (incAcct === 'Recurring Subscription (On-Prem Term License) Revenue' && printCollapsed) {
			    if ((incAcctId === RECURR_SUBSCR_REV_ACCT || incAcctId === SAAS_REVENUE_ACCT) && printCollapsed) {
			    	//if (arrProdFamily.indexOf(prodFamily) < 0) {
			    	if (arrProdFamTaxCode.indexOf(concatProdFamTaxCode) < 0) {
			    		//nlapiLogExecution('DEBUG', i, '1');
			    		var ind = arrProdFamTaxCode.length || 0;
			    		arrProdFamTaxCode[ind] = concatProdFamTaxCode;
			    		//arrProdFamily[ind] = prodFamily;
			    		//arrProdDesc[ind] = rec.getLineItemValue("item", "custcol_description_pdf", i);
			    		arrProdAmt[ind] = parseFloat(rec.getLineItemValue('item', 'amount', i));
			    		arrLine[ind] = i;
			    		continue;
			        } else {
			        	//nlapiLogExecution('DEBUG', i, '2');
			        	//var index = arrProdFamily.indexOf(prodFamily);
			        	var index = arrProdFamTaxCode.indexOf(concatProdFamTaxCode);
			        	arrProdAmt[index] += parseFloat(rec.getLineItemValue('item', 'amount', i));
			        	continue;
			        }
			    }
			    //nlapiLogExecution('DEBUG', i, '3');
			    transRec.setLineItemValue('item', 'custcol_print_amount', i, transRec.getLineItemValue('item', 'amount', i));
				
			}//End for i loop
			
			nlapiLogExecution('DEBUG', 'Finished 1st Loop', '1');
			
			
			for (var j = 0; j < arrProdFamTaxCode.length; j++) {
				sObj = {
					'concatProdFamTaxCode': arrProdFamTaxCode[j],
					//'productFamily': arrProdFamily[j],
					//'desc': arrProdDesc[j],
					'amount': arrProdAmt[j],
					'line': arrLine[j]
				};
				transRec.setLineItemValue('item', 'custcol_print_amount', arrLine[j], arrProdAmt[j]);
		    }
			nlapiLogExecution('DEBUG', 'Finished 2nd Loop', '2');
			
			
			//Identify 3rd Party Commission items, and if found to sum all 3rd Party Commission Amounts into a single Print Amount column (on the first instance of a 3rd Party Commission line)
		    //var printAmtTotal = 0;
		    //var z = 0;
		    var lastItemLookup;
		    
		    var arrTPtaxCode = [];
		    var arrThirdPtyAmt = [];
		    var arrTPLine = [];
		    
		    for (var x = 1; x <= itemCount; x++){
		    	
		    	var itemId = transRec.getLineItemValue('item', 'item', x);
		    	//var itemText = transRec.getLineItemText('item', 'item', x);
		    	var itemType = transRec.getLineItemValue('item', 'itemtype', x);
		    	
		    	//if (itemText.indexOf('commission') != '-1' && itemType == 'NonInvtPart'){
		    	if (itemType == 'NonInvtPart'){
		    		
		    		if (itemId != lastItemLookup){
		    			
		    			var thirdPtyCommItem = nlapiLookupField('noninventoryitem', itemId, 'custitem_scg_third_party_commission');
		    			lastItemLookup = itemId;
		    			
		    		}
		    		//var thirdPtyCommItem = nlapiLookupField('noninventoryitem', itemId, 'custitem_scg_third_party_commission');
		    		
		    		if (thirdPtyCommItem == 'T'){
		    			
		    			//Clear out Existing Value, if any, in the 'Print Amount' field
		    			transRec.setLineItemValue('item', 'custcol_print_amount', x, '');
		    			
		    			var tpTaxCode = transRec.getLineItemValue('item', 'taxcode', x);
		    	        nlapiLogExecution('DEBUG', '3rd party tax code', tpTaxCode);
		    			
		    			//var thirdPtyAmt = transRec.getLineItemValue('item', 'amount', x);
		    	        
		    	        //Create Arrays to tally / store Total Amt by Tax Code Information, and which line to write it to
		    			if (arrTPtaxCode.indexOf(tpTaxCode) < 0) {
		    	          	//nlapiLogExecution('debug', i, '1');
		    	          	var indTP = arrTPtaxCode.length || 0;
		    	          	nlapiLogExecution('DEBUG', 'indTP', indTP);
		    	          	arrTPtaxCode[indTP] = tpTaxCode;
		    	          	arrThirdPtyAmt[indTP] = parseFloat(transRec.getLineItemValue('item', 'amount', x));
		    	          	arrTPLine[indTP] = x;
		    	          	continue;
		    	        } else {
		    	        	//nlapiLogExecution('debug', i, '2');
		    	        	var indexTP = arrTPtaxCode.indexOf(tpTaxCode);
		    	        	nlapiLogExecution('DEBUG', 'indexTP', indexTP);
		    	        	arrThirdPtyAmt[indexTP] += parseFloat(transRec.getLineItemValue('item', 'amount', x));
		    	        	continue;
		    	        }
		    			
		    			//printAmtTotal = Number(printAmtTotal) + Number(thirdPtyAmt);
		    			
		    			//if (z == 0){
		    				//z = x;
		    			//}else{
		    				//transRec.setLineItemValue('item', 'custcol_print_amount', x, '');
		    			//}
		    			
		    		}//End if (thirdPtyCommItem == 'T')
		    		
		    	}
		    	
		    	//endUsage = nlapiGetContext().getRemainingUsage();
		        //nlapiLogExecution('DEBUG', 'End Usage After 3rd Pty Line ' + x, endUsage);
		    	
		    }//End for x loop
		    
		    for (var z = 0; z < arrTPtaxCode.length; z++) {

		    	nlapiLogExecution('DEBUG', 'Set TP Print Total on Line ' + arrTPLine[z], arrThirdPtyAmt[z]);
		    	transRec.setLineItemValue('item', 'custcol_print_amount', arrTPLine[z], arrThirdPtyAmt[z]);
		    	
		    }
		    
		    //if (z > 0){
		    	//transRec.setLineItemValue('item', 'custcol_print_amount', z, printAmtTotal);
		    //}
		    
		    //Uncheck 'Print Amount Updates Pending' to indicate that scheduled script has finished processing
		    transRec.setFieldValue('custbody_scg_print_amt_upds_pend', 'F');
		    nlapiLogExecution('DEBUG', 'Print Amount Updates Pending', 'UNCHECKED');
		    
		    nlapiLogExecution('DEBUG', 'Ready to Submit Record', 'SUBMIT');
			
			nlapiSubmitRecord(transRec);
			
			
			nlapiLogExecution('DEBUG', 'Check off Custom Record Complete', 'COMPLETE');
			
			
			// Update the Rev Amt Num Devices Processing Queue record
			nlapiSubmitField('customrecord_scg_updprintamount_queue', upaQueueId.getId(), 'custrecord_scg_upa_complete', 'T');
			
			
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
					nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', transId );
				} else if (e.getCode() == 'RCRD_HAS_BEEN_CHANGED') {
					nlapiLogExecution( 'DEBUG', 'ERROR! Record Has Been Changed', 'ERROR on ' + transId );
				} else {
					errorMessage = e.getCode() + '\n' + e.getDetails();
					nlapiLogExecution( 'DEBUG', 'system error', errorMessage );
				}
			} else {
				errorMessage = e.toString();
				nlapiLogExecution( 'DEBUG', 'unexpected error', errorMessage );
			}
			// Record the error on the Employee Processing Queue record
			nlapiSubmitField('customrecord_scg_updprintamount_queue', upaQueueId.getId(), 'custrecord_scg_upa_error', errorMessage);
		}
	});
	
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
function is_upa_scheduledBatch(arr, proc) {

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
		nlapiLogExecution('debug', 'End Usage / Run Usage', endUsage + ' / ' + runUsage);
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
 * Returns a list of Sales Orders to be processed with Order Type Segment line level updates
 * 
 * @appliedtorecord customrecord_scg_emp_processing_queue
 * 
 * @returns {nlobjSearch}
 */
function is_upa_getPrintAmtQueueIds() {
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custrecord_scg_upa_complete', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_scg_upa_error', null, 'isempty', null));

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('custrecord_scg_upa_transaction', null, null));
	//columns.push(new nlobjSearchColumn('custrecord_scg_prand_trans_type', null, null));
	columns.push(new nlobjSearchColumn('created', null, null).setSort(false /* ascending */));

	return nlapiSearchRecord('customrecord_scg_updprintamount_queue', null, filters, columns);
}




function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
} 




function getIncAcctID(incAcct){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('name', null, 'contains', incAcct));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('name', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('account', null, filters, columns);
	  
	// Return
	return results;
	
}



