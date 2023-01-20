/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       17 Sep 2018     Doug Humberd     Handles user events on Customer records
 * 1.00       17 Sep 2018     Doug Humberd     Added afterSubmit functionality to add subsidiaries (customer-subsidiary relationships) on create for Customer records
 * 1.10       27 Sep 2018     Doug Humberd     Added afterSubmit functionality to add currencies to Customer record on create.  Values are read from a custom record - Add Currencies to Customer
 * 1.20       08 Feb 2019     Doug Humberd     Updated "is_cus_createCustomerSubsidiaryRelationships" to only add subsidiaries if 'Represents Subsidiary' is empty
 * 1.25       31 Jul 2020     Doug Humberd     Added 'is_cus_cleanMultInvEmails' to clean up the 'Multiple Invoice Emails' by having all email entries separated by a semicolon
 * 1.30       17 Sep 2020     Doug Humberd     Updated 'is_cus_cleanMultInvEmails' to clean up additional special characters
 * 1.35       25 Jan 2022     Doug Humberd     Updated 'is_cus_addCurrencytoCustomer' to correct for governance issues
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord customer
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_cus_beforeLoad(type, form, request){
    try {
    	//is_cus_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_cus_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately prior to a write event on a record.
 *
 * @appliedtorecord customer
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_cus_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
    	is_cus_cleanMultInvEmails(type);
        //is_cus_beforeSubmitFunction(type);
    } catch (e) {
        is_cus_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord customer
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_cus_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        is_cus_createCustomerSubsidiaryRelationships(type);
        is_cus_addCurrencytoCustomer(type);
    } catch (e) {
        is_cus_logError(e);
        throw e;
    }
}


/**
 * Writes an error message to the Script Execution Log
 *
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 *
 * @returns {Void}
 */
function is_cus_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord customer
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_cus_createCustomerSubsidiaryRelationships(type){
	
	//Only run on create
	if (type != 'create'){
		return;
	}
	
	var custRec = nlapiGetNewRecord();
	var custId = custRec.getId();
	nlapiLogExecution('DEBUG', 'Customer ID', custId);
	var primSub = custRec.getFieldValue('subsidiary');
	nlapiLogExecution('DEBUG', 'Primary Subsidiary', primSub);
	
	var repSub = custRec.getFieldValue('representingsubsidiary');
	
	if (!isEmpty(repSub)){
		nlapiLogExecution('DEBUG', 'Value found in Represents Subsidiary: ' + repSub, 'EXIT');
		return;
	}
	
	var searchresults = getSubsidiaryIDs();
	
	for (var i = 0; i < searchresults.length; i++){
		
		var subId = searchresults[i].getValue('internalid');
		
		if (subId != primSub){
			
			nlapiLogExecution('DEBUG', 'Create Subsidiary Entry for ID', subId);
			
			//Create Customer-Subsidiary Relationship
			var vsr = nlapiCreateRecord('customersubsidiaryrelationship');
			vsr.setFieldValue('entity', custId);
			vsr.setFieldValue('subsidiary', subId);
			nlapiSubmitRecord(vsr);
			
		}
		
	}
	
}



function getSubsidiaryIDs(){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_scg_add_to_new_cust', null, 'is', 'T'));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('subsidiary', null, filters, columns);
	  
	// Return
	return results;
	
}



/**
 * Adds Currency Values to a Customer record on create.
 * Currency Values are identifed in a custom record - "Add Currencies to Customer"
 *
 * @appliedtorecord customer
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_cus_addCurrencytoCustomer(type){
	
	//Only run on create
	if (type != 'create'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'Start addCurrencytoCustomer', 'START');
	var custRec = nlapiGetNewRecord();
	var custId = custRec.getId();
	nlapiLogExecution('DEBUG', 'Customer ID', custId);
	var primCurr = custRec.getFieldValue('currency');
	var primCurrText = custRec.getFieldText('currency');
	nlapiLogExecution('DEBUG', 'Primary Currency', primCurr);
	nlapiLogExecution('DEBUG', 'Primary Currency Text', primCurrText);
	
	//Load the Customer Record
	var newCustRec = nlapiLoadRecord('customer', custId);
	
	//Search Custom Record to determine which currencies to add to customer record
	var searchresults = getCustRecCurrencies();
	
	for (var i = 0; i < searchresults.length; i++){
		
		//var currId = searchresults[i].getValue('internalid');
		//nlapiLogExecution('DEBUG', 'Custom Record Currency', currId);
		var crCurrText = searchresults[i].getText('custrecord_scg_actc_currency');
		//nlapiLogExecution('DEBUG', 'Custom Record Currency Text', crCurrText);
		
		if (crCurrText != primCurrText){
			nlapiLogExecution('DEBUG', 'Add Currency', crCurrText);
			
			//Search Currency Records to obtain internal ID that matches Custom Record currency text
			var currencySearchresults = getCurrencyIds();
			
			for (var x = 0; x < currencySearchresults.length; x++){
				
				var currId = currencySearchresults[x].getValue('internalid');
				var currText = currencySearchresults[x].getValue('name');
				
				if (currText == crCurrText){
					
					//nlapiLogExecution('DEBUG', 'Currency ID: ' + currId, 'Currency Text: ' + currText);
					
					//Add Currency to Customer Record
					//var newCustRec = nlapiLoadRecord('customer', custId);
					newCustRec.selectNewLineItem('currency');
					newCustRec.setCurrentLineItemValue('currency', 'currency', currId);
					newCustRec.commitLineItem('currency');
					//nlapiSubmitRecord(newCustRec);
					
				}
				
			}//End Currency Search Loop
			
		}
		
	}//End Custom Record Search Loop
	
	//Save the Customer Record
	nlapiSubmitRecord(newCustRec);
	
}



function getCustRecCurrencies(){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_scg_actc_add_currency', null, 'is', 'T'));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('custrecord_scg_actc_currency', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('customrecord_scg_add_currency_to_cust', null, filters, columns);
	  
	// Return
	return results;
	
}



function getCurrencyIds(){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('name', null, null));
	  
	// Get results
	var currResults = nlapiSearchRecord('currency', null, filters, columns);
	  
	// Return
	return currResults;
	
}




function is_cus_cleanMultInvEmails(type){
	
	if (type != 'create' && type != 'edit'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'cleanMultInvEmails', 'START');
	
	var multInvEmails = nlapiGetFieldValue('custentity_scg_mult_inv_emails');
	nlapiLogExecution('DEBUG', 'Mult Inv Emails BEFORE CLEAN', multInvEmails);
	
	var cleanField = 'N';
	
	if (type == 'create'){
		cleanField = 'Y';
	}
	
	if (type == 'edit'){
		
		//var multInvEmails = nlapiGetFieldValue('custentity_scg_mult_inv_emails');
		//nlapiLogExecution('DEBUG', 'Mult Inv Emails BEFORE CLEAN', multInvEmails);
		
		var oldCustRec = nlapiGetOldRecord();
		var origMultInvEmails = oldCustRec.getFieldValue('custentity_scg_mult_inv_emails');
		
		if (multInvEmails != origMultInvEmails){
			nlapiLogExecution('DEBUG', 'Mult Inv Emails Changed', 'CHANGED');
			cleanField = 'Y';
		}
		
	}
	
	if (cleanField == 'Y'){
		
		if (!isEmpty(multInvEmails)){
			
			while (multInvEmails.indexOf(' ') != -1){
				multInvEmails = multInvEmails.replace(' ', '');
			}
			while (multInvEmails.indexOf(',') != -1){
				multInvEmails = multInvEmails.replace(',', ';');
			}
			while (multInvEmails.indexOf('#') != -1){
				multInvEmails = multInvEmails.replace('#', '');
			}
			while (multInvEmails.indexOf('<') != -1){
				multInvEmails = multInvEmails.replace('<', '');
			}
			while (multInvEmails.indexOf('>') != -1){
				multInvEmails = multInvEmails.replace('>', '');
			}
			while (multInvEmails.indexOf('@@') != -1){
				multInvEmails = multInvEmails.replace('@@', '@');
			}
			while (multInvEmails.indexOf('*') != -1){
				multInvEmails = multInvEmails.replace('*', '');
			}
			while (multInvEmails.indexOf('!') != -1){
				multInvEmails = multInvEmails.replace('!', '');
			}
			while (multInvEmails.indexOf('%') != -1){
				multInvEmails = multInvEmails.replace('%', '');
			}
			while (multInvEmails.indexOf('&') != -1){
				multInvEmails = multInvEmails.replace('&', '');
			}
			while (multInvEmails.indexOf('\r') != -1){
				multInvEmails = multInvEmails.replace('\r', ';');
			}
			while (multInvEmails.indexOf('\n') != -1){
				multInvEmails = multInvEmails.replace('\n', '');
			}
			
			nlapiLogExecution('DEBUG', 'Mult Inv Emails AFTER CLEAN', multInvEmails);
			
			nlapiSetFieldValue('custentity_scg_mult_inv_emails', multInvEmails);
			
		}
		
	}//End if (cleanField == 'Y')
	
}




function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}


