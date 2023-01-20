/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       21 Aug 2018     Doug Humberd     Handles client events on Vendor Bill records
 * 1.10       05 Mar 2019     Doug Humberd     Added fieldChanged function "is_vb_chkDupInvoiceNum_fc" and saveRecord function "is_vb_chkDupInvoiceNum_sr" to check for and prevent duplicate Vendor / Invoice No combinations
 * 1.15       11 Mar 2019     Doug Humberd     Updated saveRecord function "is_vb_chkDupInvoiceNum_sr" to check for transaction number so that it doesn't consider itself a duplicate
 * 1.20       12 Mar 2019     Doug Humberd     Remove saveRecord function - no longer necessary
 *
 */


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord vendorbill
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_vb_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
		alert(e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
		alert(e.toString());
	}
}


/**
 * Performs actions when a field is changed in the user's browser
 *
 * @appliedtorecord vendorbill
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_vb_fieldChanged(type, name, linenum){
    try {
        is_vb_chkDupInvoiceNum_fc(type, name, linenum);
    } catch (e) {
    	is_vb_logError(e);
    }
}



/**
 * Handles client events after dependent fields are updated upon a field changed event
 *
 * @appliedtorecord vendorbill
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function is_vb_postSourcing(type, name) {
    try {
    	//is_vb_postSourcingFunction(type, name);
    } catch (e) {
    	is_vb_logError(e);
        throw e;
    }
}



/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord vendorbill
 *
 * @returns {Boolean} True to continue save, false to abort save
 */
function is_vb_saveRecord(){
	try {
		//var retVal = is_vb_chkDupInvoiceNum_sr();
		//retVal = (retVal) ? is_vb_saveRecordFunction() : false;
		//return retVal;
	} catch (e) {
		is_vb_logError(e);
		throw e;
	}
}



/**
 * Records the rejection reason on a vendor bill
 *  
 * @appliedtorecord vendorbill
 *   
 * @returns {Void}
 */
function is_vb_rejectionPopup() {
	var reason = prompt('Enter rejection reason below:',''); 
	if (reason != null) {
		var vbRec = nlapiGetRecordId()
		nlapiSubmitField('vendorbill', vbRec, 'custbody_scg_reject_reason_vb', reason);
		//var currentState = nlapiGetFieldValue('custbody_scg_po_appvl_current_state');
		//var currentState = nlapiLookupField('purchaseorder', vbRec, 'custbody_scg_po_appvl_current_state');
		//nlapiLogExecution('DEBUG', 'Current State', currentState);

		//window.location = nlapiResolveURL('SUITELET', 'customscript_scg_purchaseorder_sl', 'customdeploy_scg_purchaseorder_sl') + '&poid=' + nlapiGetRecordId() + '&buttonid=REJECTION' + '&currentstate=' + currentState;
		window.location = nlapiResolveURL('SUITELET', 'customscript_scg_vendorbill_sl', 'customdeploy_scg_vendorbill_sl') + '&vbid=' + nlapiGetRecordId() + '&buttonid=REJECTION';
	}
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
 * Checks to see if a duplicate invoice number is being entered.  Clears out Invoice No. if duplicate found
 *
 * @appliedtorecord vendorbill
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_vb_chkDupInvoiceNum_fc(type, name, linenum){//fieldChanged function
	
	if (name == 'tranid'){
		
		var invNum = nlapiGetFieldValue('tranid');
		var vendor = nlapiGetFieldValue('entity');
		var vendorText = nlapiGetFieldText('entity');
		//alert ('TranID = ' + invNum + '\n\nVendor = ' + vendor);
		
		if (!isEmpty(invNum) && !isEmpty(vendor)){
			
			var searchresults = checkVendorBill(invNum, vendor);
			
			if (searchresults != null && searchresults.length > 0){
				alert ('Invoice No \"' + searchresults[0].getValue('tranid') + '\" has already been used with Vendor \"' + vendorText + '\".\n\n(See ' + searchresults[0].getValue('transactionnumber') + ')\n\nThe Invoice Number will be cleared out.\n');
				nlapiSetFieldValue('tranid', '');
			}
			
		}
		
	}
	
}


//REMOVE - NOT NEEDED
/**
 * Checks to see if a duplicate invoice number is being entered.  Prevents save if duplicate found
 *
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord vendorbill
 *
 * @returns {Boolean} True to continue save, false to abort save
 */
/*
function is_vb_chkDupInvoiceNum_sr(){//saveRecord function
	
	var retVal = true;
	
	var invNum = nlapiGetFieldValue('tranid');
	var vendor = nlapiGetFieldValue('entity');
	var vendorText = nlapiGetFieldText('entity');
	var transNum = nlapiGetFieldValue('transactionnumber');
	//alert ('TranID = ' + invNum + '\n\nVendor = ' + vendor);
	
	if (!isEmpty(invNum) && !isEmpty(vendor)){
		
		var searchresults = checkVendorBill(invNum, vendor);
		
		for (var i = 0; i < searchresults.length; i++){
			
			var searchTranNum = searchresults[i].getValue('transactionnumber');
			//alert ('Transactoin Number = ' + transNum + '\nSearch Transaction Number = ' + searchTranNum);
			
			if (searchTranNum != transNum){
				alert ('Invoice No \"' + searchresults[i].getValue('tranid') + '\" has already been used with Vendor \"' + vendorText + '\".\n\n(See ' + searchresults[i].getValue('transactionnumber') + ')\n\nSave Cancelled.\n');
				retVal = false;
			    return retVal;
			}
			
		}
		
	}

	return retVal;
	
}
*/


function checkVendorBill(invNum, vendor){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('numbertext', null, 'is', invNum));
	filters.push(new nlobjSearchFilter('name', null, 'anyof', vendor));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('tranid', null, null));
	columns.push(new nlobjSearchColumn('entity', null, null));
	columns.push(new nlobjSearchColumn('transactionnumber', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('vendorbill', null, filters, columns);
	  
	// Return
	return results;
	
}