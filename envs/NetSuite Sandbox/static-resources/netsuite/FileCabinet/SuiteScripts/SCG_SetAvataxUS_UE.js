/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       09 Sep 2021     Doug Humberd     Sets the Tax Code Value to "Avatax" for Invoices, Sales Orders and Credit Memos when Nexus = US
 *                            Doug Humberd     Do not run if 'Data Migration' is checked
 * 1.05       13 Oct 2021     Doug Humberd     Added 'is_avataxus_setDefaultTaxCodes' to set default tax codes for various countries
 * 1.06       18 Oct 2021     Doug Humberd     Change Tax Code Override field from 'custbody_ava_taxoverride' to 'custbody_scg_sf_total_tax'
 * 1.07       28 Oct 2021     Doug Humberd     Removed 'Created From' control from the Default Tax Code function
 * 1.10       10 Nov 2021     Doug Humberd     Updated 'is_avataxus_setDefaultTaxCodes' with SF Total Tax and Data Migration Checks
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const AVATAX = '1239';
const AVATAX_CAN = '13028';//Tax Group: AVATAX-CAN



/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization, cashsale
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_avataxus_beforeLoad(type, form, request){
    try {
        //is_avataxus_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_avataxus_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately before a write event on a record.
 *
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization, cashsale
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_avataxus_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        is_avataxus_setAvataxUS(type);
        is_avataxus_setDefaultTaxCodes(type);
    } catch (e) {
        is_avataxus_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization, cashsale
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_avataxus_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        //is_avataxus_afterSubmitFunction(type);
    } catch (e) {
        is_avataxus_logError(e);
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
function is_avataxus_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



function is_avataxus_setAvataxUS(type){
	
	//Only run on create (also run on edit, but only if the "Update Tax Codes" field is checked)
	if (type != 'create' && type != 'edit'){
	//if (type != 'create'){
		return;
	}
	
	//Only run if Tax Amount Override is not checked
	//var taxAmtOverride = nlapiGetFieldValue('custbody_ava_taxoverride');
	//if (taxAmtOverride == 'T'){
		//nlapiLogExecution('DEBUG', 'Tax Amount Override Checked', 'EXIT');
		//return;
	//}
	
	var taxAmtOverride = nlapiGetFieldValue('custbody_scg_sf_total_tax');
	if (!isEmpty(taxAmtOverride)){
		nlapiLogExecution('DEBUG', 'SF Total Tax is Populated', 'EXIT');
		return;
	}
	
	//Only run in Edit mode if Update Tax Codes is checked
	var updTaxCodes = nlapiGetFieldValue('custbody_scg_update_taxcodes');
	nlapiLogExecution('DEBUG', 'Update Tax Codes', updTaxCodes);
	if (type == 'edit' && (updTaxCodes == 'F' || isEmpty(updTaxCodes))){
		return;
	}
	
	//Only run in Create mode if Created From is empty
	//var createdFrom = nlapiGetFieldValue('createdfrom');
	//if (type == 'create' && !isEmpty(createdFrom)){
		//return;
	//}
	
	var dataMigration = nlapiGetFieldValue('custbody_data_migration');
	if (dataMigration == 'T'){
		return;
	}

	var transRec = nlapiGetNewRecord();
	var transType = transRec.getRecordType();
	var transId = transRec.getId();
	var customer = transRec.getFieldValue('entity');
	var subsidiary = transRec.getFieldValue('subsidiary');
	//var subCountry = nlapiLookupField('subsidiary', subsidiary, 'country');
	var nexusCountry = transRec.getFieldValue('nexus_country');
	
	
	if (transType == 'purchaseorder' || transType == 'vendorbill' || transType == 'vendorcredit'){
		var shipCountry = transRec.getFieldText('custbody_shipping_country');
		nlapiLogExecution('DEBUG', 'shipCountry before Search = ', shipCountry);
		
		if (!shipCountry){
			return;
		}
		
		//Convert Custom Shipping Country value to the 2 digit country code
		var searchCode = getCountryCode(shipCountry);
		
		if (searchCode){
			shipCountry = searchCode[0].getValue('custrecord_cr_country_code');
		}
		nlapiLogExecution('DEBUG', 'shipCountry after Search = ', shipCountry);

	}else{
		var shipCountry = transRec.getFieldValue('shipcountry');
		var shipState = transRec.getFieldValue('shipstate');
		nlapiLogExecution('DEBUG', 'ship state', shipState);
	}
	
	nlapiLogExecution('DEBUG', 'shipCountry for recType ' + transType, shipCountry);
	
	//var shipCountry = transRec.getFieldValue('shipcountry');
	
	
	//var checkOS_AU = transRec.getFieldValue('custbody_scg_check_os_au');
	
	nlapiLogExecution('DEBUG', 'Trans Type = ' + transType, 'Trans ID = ' + transId);
	nlapiLogExecution('DEBUG', 'Customer', customer);
	nlapiLogExecution('DEBUG', 'Subsidiary = ' + subsidiary, 'Ship Country = ' + shipCountry);
	//nlapiLogExecution('DEBUG', 'Subsidiary Country', subCountry);
	nlapiLogExecution('DEBUG', 'Nexus Country', nexusCountry);
	nlapiLogExecution('DEBUG', 'Type', type);

	
	//Determine if Customer/Subsidiary combo is Exempt
	//var exempt = 'F';
	
	//var searchExempt = isExempt(customer, subsidiary);
	
	//if (searchExempt){
		//nlapiLogExecution('DEBUG', 'Exempt Record Found', 'SET EXEMPT CODE');
		//exempt = 'T';
	//}
	
	//*******************************************************************************
	//UNITED STATES   UNITED STATES   UNITED STATES   UNITED STATES   UNITED STATES
	//*******************************************************************************
	
	//Set Tax Code to AVATAX
	//if (subCountry == 'US' && shipCountry == 'US'){
	if (nexusCountry == 'US'){
		
		var lineCount = nlapiGetLineItemCount('item');
		
		for(var x = 1; x <= lineCount; x++){
			
			//var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
			//nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
			//if (taxItem == 'T'){
				//nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
				//continue;
			//}
			
			var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
			var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
			nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
			
			if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
				nlapiLogExecution('DEBUG', 'Set TaxCode Value To', AVATAX);
				nlapiSetLineItemValue('item', 'taxcode', x, AVATAX);
			}
			
			//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', AVATAX);
			//nlapiSetLineItemValue('item', 'taxcode', i, AVATAX);
			
		}
		
	}//End if (nexusCountry == 'US')

		
	
	//If checked, uncheck the Update Tax Codes field
	if (updTaxCodes == 'T'){
		nlapiSetFieldValue('custbody_scg_update_taxcodes', 'F');
	}
	
}





function getCountryCode(shipCountry){
	
	//Define filters
	var filters = new Array();
	//filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('name', null, 'is', shipCountry));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('custrecord_cr_country_code', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('customrecord_countries_regions', null, filters, columns);
	  
	// Return
	return results;
	
}





function is_avataxus_setDefaultTaxCodes(type){
	
	//Only run on create
	//if (type != 'create' && type != 'edit'){//TEMP CODE
	if (type != 'create'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'setDefaultTaxCodes', 'START');
	
	//Only run if Created From is not empty
	//var createdFrom = nlapiGetFieldValue('createdfrom');
	//if (isEmpty(createdFrom)){
		//return;
	//}
	
	var taxAmtOverride = nlapiGetFieldValue('custbody_scg_sf_total_tax');
	if (!isEmpty(taxAmtOverride)){
		nlapiLogExecution('DEBUG', 'SF Total Tax is Populated', 'EXIT');
		return;
	}
	
	var dataMigration = nlapiGetFieldValue('custbody_data_migration');
	if (dataMigration == 'T'){
		return;
	}

	var transRec = nlapiGetNewRecord();
	var transType = transRec.getRecordType();
	var transId = transRec.getId();
	var nexusCountry = transRec.getFieldValue('nexus_country');
	var defTaxCode = '';
	var taxCodeId;
	
	nlapiLogExecution('DEBUG', 'Transaction ID: ' + transId, 'Record Type: ' + transType);
	nlapiLogExecution('DEBUG', 'Nexus Country', nexusCountry);

	
	//Only run for Invoices and Credit Memos
	if (transType != 'invoice' && transType != 'creditmemo'){
		return;
	}
	
	
	//Get and Set Default Tax Code for Specified Nexus Country (if not US)
	if (!isEmpty(nexusCountry) && nexusCountry != 'US'){
		
		var searchDefTaxCode = getDefaultTaxCode(nexusCountry);
		
		if (searchDefTaxCode){
			defTaxCode = searchDefTaxCode[0].getValue('name');
			taxCodeId = searchDefTaxCode[0].getValue('internalid');
		}
		nlapiLogExecution('DEBUG', 'Default Tax Code for Country: ' + nexusCountry, defTaxCode + ' (' + taxCodeId + ')');
		
		
		//Hardcode Canada Tax Code (uses Tax Group, not Tax Code, so search is returning incorrect value)
		if (nexusCountry == 'CA'){
			taxCodeId = AVATAX_CAN;
		}
		
		
		//Update Tax Code on lines where the Default Value is not set already
		var lineCount = nlapiGetLineItemCount('item');
		
		for(var i = 1; i <= lineCount; i++){
			
			var existTaxCode = nlapiGetLineItemValue('item', 'taxcode', i);
			nlapiLogExecution('DEBUG', 'Existing Tax Code Line ' + i, existTaxCode);
			
			if (existTaxCode != taxCodeId){
				nlapiLogExecution('DEBUG', 'Line ' + i + ': Set TaxCode Value To', taxCodeId);
				nlapiSetLineItemValue('item', 'taxcode', i, taxCodeId);
			}else{
				nlapiLogExecution('DEBUG', 'TaxCode is Already the Default Value on Line ' + i, 'No Update Needed');
			}
			
		}//End for i loop
		
	}//End if (!isEmpty(nexusCountry))
	
}





function getDefaultTaxCode(nexusCountry){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('isdefault', null, 'is', 'T'));
	filters.push(new nlobjSearchFilter('country', null, 'anyof', nexusCountry));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('name', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('salestaxitem', null, filters, columns);
	  
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





