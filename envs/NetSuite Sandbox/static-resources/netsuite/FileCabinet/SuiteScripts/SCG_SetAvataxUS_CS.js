/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       09 Sep 2021     Doug Humberd     Sets the Tax Code Value to "Avatax" for Invoices, Sales Orders and Credit Memos when Item is Entered if Nexus = US
 *                            Doug Humberd     Do not run if 'Data Migration' is checked
 * 1.01       18 Oct 2021     Doug Humberd     Change Tax Code Override field from 'custbody_ava_taxoverride' to 'custbody_scg_sf_total_tax'
 * 1.05       21 Oct 2021     Doug Humberd     Added saveRecord function to set AVATAX, to correct timing issue with Avalara not triggering
 * 1.10       10 Nov 2021     Doug Humberd     Updated 'is_avataxus_defaultTaxCodes_nonUS' with SF Total Tax and Data Migration Checks
 *                                             
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const AVATAX = '1239';
const AVATAX_CAN = '13028';//Tax Group: AVATAX-CAN




/**
 * Performs actions when a field is changed in the user's browser
 *
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization, cashsale
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_avataxus_fieldChanged (type, name, linenum) {
	try {
		is_avataxus_recalcTaxCodesIfShipCntryChanged(type, name, linenum);
		//is_avataxus_fieldChangedFunction(type, name, linenum);
	} catch (e) {
		is_avataxus_logError(e);
		throw e;
	}
}





/**
 * Handles client events after dependent fields are updated upon a field changed event
 *
 * @appliedtorecord salesorder, invoice, creditmemo, returnauthorization, cashsale
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function is_avataxus_postSourcing(type, name) {
    try {
    	is_avataxus_setAvataxUS(type, name);
    } catch (e) {
    	is_avataxus_logError(e);
        throw e;
    }
}




/**
 * Handles validation prior to the form being submitted to the server
 *  
 * @param {Boolean}
 */
function is_avataxus_saveRecord() {
	try {
		var retVal = false;
		retVal = is_avataxus_setAvatax_US();
		retVal = (retVal) ? is_avataxus_defaultTaxCodes_nonUS() : false;
		//retVal = (retVal) ? is_avataxus_saveRecordScript() : false;
		//retVal = (retVal) ? true /* replace with additional function_name() */ : false;
		return retVal;
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



function is_avataxus_setAvataxUS(type, name){
	
	if (name == 'item'){
		
		//var subsidiary = nlapiGetFieldValue('subsidiary');
		
		//if (!subsidiary){
			//return;
		//}
		
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
		
		var dataMigration = nlapiGetFieldValue('custbody_data_migration');
		
		if (dataMigration == 'T'){
			return;
		}
		
		//var subCountry = nlapiLookupField('subsidiary', subsidiary, 'country');
		var nexusCountry = nlapiGetFieldValue('nexus_country');
		//alert ('Nexus Country = ' + nexusCountry);
		
		var recType = nlapiGetRecordType();
		//alert('recType = ' + recType);
		
		if (recType == 'purchaseorder' || recType == 'vendorbill' || recType == 'vendorcredit'){
			var shipCountry = nlapiGetFieldText('custbody_shipping_country');
			//alert ('shipCountry before Search = ' + shipCountry);
			if (!shipCountry){
				return;
			}
			
			//Convert Custom Shipping Country value to the 2 digit country code
			var searchCode = getCountryCode(shipCountry);
			
			if (searchCode){
				shipCountry = searchCode[0].getValue('custrecord_cr_country_code');
			}
			//alert ('shipCountry after Search = ' + shipCountry);
		}else{
			var shipCountry = nlapiGetFieldValue('shipcountry');
			var shipState = nlapiGetFieldValue('shipstate');
			//alert ('shipState = ' + shipState);
		}
		
		//alert ('shipCountry for recType ' + recType + ' is ' + shipCountry);
		
		
		//var customer = nlapiGetFieldValue('entity');
		//alert ('Customer = ' + customer + '\n\nSubsidiary = ' + subsidiary + '\n\nShipCountry = ' + shipCountry + '\n\nSubsidiary Country = ' + subCountry);
		
		//Determine if Customer/Subsidiary combo is Exempt
		//var exempt = 'F';
		
		//var searchExempt = isExempt(customer, subsidiary);
		
		//if (searchExempt){
			//alert ('Exempt Record Found');
			//exempt = 'T';
		//}
		
		
		//*******************************************************************************
		//UNITED STATES   UNITED STATES   UNITED STATES   UNITED STATES   UNITED STATES
		//*******************************************************************************
		
		//Set Tax Code to AVATAX
		//if (subCountry == 'US' && shipCountry == 'US'){
		if (nexusCountry == 'US'){
			
			var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
			var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
			
			if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
				nlapiSetCurrentLineItemValue('item', 'taxcode', AVATAX);
			}
			
			//alert ('Got a Hit!!  Set TaxCode to ' + AVATAX);
			//nlapiSetCurrentLineItemValue('item', 'taxcode', AVATAX);
			
		}

		
	}//End if (name == 'item')
	
	
}







function isEuropeanCountry(shipCountry){
	
	//Define filters
	var filters = new Array();
	//filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_cr_country_code', null, 'is', shipCountry));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('custrecord_ec', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('customrecord_countries_regions', null, filters, columns);
	  
	// Return
	return results;
	
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




function is_avataxus_recalcTaxCodesIfShipCntryChanged(type, name, linenum){
	
	if (name == 'custbody_shipping_country'){
		//alert ('Custom Shipping Country modified');
		
		var transId = nlapiGetRecordId();
		//alert ('transId (custbody_shipping_country) = ' + transId);
		
		if (isEmpty(transId)){
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
		
		var dataMigration = nlapiGetFieldValue('custbody_data_migration');
		
		if (dataMigration == 'T'){
			return;
		}
		
		var recType = nlapiGetRecordType();
		//alert('recType = ' + recType);
		
		//Only Run for 'Purchase' records
		if (recType != 'purchaseorder' && recType != 'vendorbill' && recType != 'vendorcredit'){
			return;
		}
		
		var click = confirm('You have modified the Shipping Country field, which could mean that an alternate tax code would apply to each line item.\n\nWould you like to update all tax codes?\n(NOTE: Tax Codes will update after the record is saved).\n');
		
		if (click == true){
			nlapiSetFieldValue('custbody_scg_update_taxcodes', 'T');
		}else{
			nlapiSetFieldValue('custbody_scg_update_taxcodes', 'F');
		}
		
	}//End if (name == 'custbody_shipping_country')
	
	
	if (name == 'shipaddress'){
		//alert ('shipaddress modified');
		
		var transId = nlapiGetRecordId();
		//alert ('transId (shipaddress) = ' + transId);
		
		if (isEmpty(transId)){
			return;
		}
		
		var recType = nlapiGetRecordType();
		//alert('recType = ' + recType);
		
		var oldCountry = nlapiLookupField(recType, transId, 'shipcountry');
		var newCountry = nlapiGetFieldValue('shipcountry');
		
		//alert ('old country = ' + oldCountry + '\n\nnew country = ' + newCountry);
		
		//if (oldCountry != newCountry){
		if (oldCountry != newCountry && newCountry == 'US'){
			
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
			
			var dataMigration = nlapiGetFieldValue('custbody_data_migration');
			
			if (dataMigration == 'T'){
				return;
			}
			
			//Only Run for Non 'Purchase' records
			if (recType == 'purchaseorder' || recType == 'vendorbill' || recType == 'vendorcredit'){
				return;
			}
			
			//REMOVE CONFIRMATION PROMPT PER CHERRIE - 6/18/20
			//var click = confirm('You have modified the Shipping Country, which could mean that an alternate tax code would apply to each line item.\n\nWould you like to update all tax codes?\n(NOTE: Tax Codes will update after the record is saved).\n');
			var click = true;
			
			if (click == true){
				nlapiSetFieldValue('custbody_scg_update_taxcodes', 'T');
			}else{
				nlapiSetFieldValue('custbody_scg_update_taxcodes', 'F');
			}
			
		}//End if (oldCountry != newCountry)
		
	}//End if (name == 'shipaddress')
	

	
}





function is_avataxus_setAvatax_US(){
	
	var retVal = true;
	
	//Only run if SF Total Tax is Populated
	var taxAmtOverride = nlapiGetFieldValue('custbody_scg_sf_total_tax');
	if (!isEmpty(taxAmtOverride)){
		nlapiLogExecution('DEBUG', 'SF Total Tax is Populated', 'EXIT');
		return retVal;
	}
	
	var dataMigration = nlapiGetFieldValue('custbody_data_migration');
	if (dataMigration == 'T'){
		return retVal;
	}
	
	var transId = nlapiGetRecordId();
	var transType = nlapiGetRecordType();
	
	if (isEmpty(transId)){//If Empty, create mode
		
		//nlapiSubmitField('vendor', vendId, 'custentity_scg_vend_chg_det_req', 'F');
		//var vendRec = nlapiLoadRecord('vendor', vendId, {recordmode: 'dynamic'});
		//vendRec.setFieldValue('custentity_scg_vend_chg_det_req', 'F');
		//nlapiSubmitRecord(vendRec);
		
	}else{//edit mode
		
		//Only run in Edit mode if Update Tax Codes is checked
		var updTaxCodes = nlapiGetFieldValue('custbody_scg_update_taxcodes');
		nlapiLogExecution('DEBUG', 'Update Tax Codes', updTaxCodes);
		if (updTaxCodes == 'F' || isEmpty(updTaxCodes)){
			return retVal;
		}
		
		//alert ('Got a hit');
		//nlapiSubmitField('vendor', vendId, 'custentity_scg_vend_chg_det_req', 'F');
		//var vendRec = nlapiLoadRecord('vendor', vendId, {recordmode: 'dynamic'});
		//vendRec.setFieldValue('custentity_scg_vend_chg_det_req', 'F');
		//nlapiSubmitRecord(vendRec);
		
	}
	
	
	var nexusCountry = nlapiGetFieldValue('nexus_country');
	var shipCountry = nlapiGetFieldValue('shipcountry');
	var shipState = nlapiGetFieldValue('shipstate');
	nlapiLogExecution('DEBUG', 'ship state', shipState);
	
	
	//*******************************************************************************
	//UNITED STATES   UNITED STATES   UNITED STATES   UNITED STATES   UNITED STATES
	//*******************************************************************************
	
	//Set Tax Code to AVATAX
	//if (subCountry == 'US' && shipCountry == 'US'){
	if (nexusCountry == 'US'){
		
		var lineCount = nlapiGetLineItemCount('item');
		
		for(var x = 1; x <= lineCount; x++){
			
			var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
			var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
			nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
			
			if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
				nlapiLogExecution('DEBUG', 'Set TaxCode Value To', AVATAX);
				//nlapiSetLineItemValue('item', 'taxcode', x, AVATAX);
				nlapiSelectLineItem('item', x);
				nlapiSetCurrentLineItemValue('item', 'taxcode', AVATAX, true, true);
				nlapiCommitLineItem('item');
			}
			
			//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', AVATAX);
			//nlapiSetLineItemValue('item', 'taxcode', i, AVATAX);
			
		}
		
	}//End if (nexusCountry == 'US')
	
	
	
	return retVal;
	
}






function is_avataxus_defaultTaxCodes_nonUS(){
	
	var retVal = true;
	
	nlapiLogExecution('DEBUG', 'defaultTaxCodes_nonUS', 'START');
	
	var taxAmtOverride = nlapiGetFieldValue('custbody_scg_sf_total_tax');
	if (!isEmpty(taxAmtOverride)){
		nlapiLogExecution('DEBUG', 'SF Total Tax is Populated', 'EXIT');
		return retVal;
	}
	
	var dataMigration = nlapiGetFieldValue('custbody_data_migration');
	if (dataMigration == 'T'){
		return retVal;
	}
	
	//var transRec = nlapiGetNewRecord();
	var transType = nlapiGetRecordType();
	var transId = nlapiGetRecordId();
	var nexusCountry = nlapiGetFieldValue('nexus_country');
	var defTaxCode = '';
	var taxCodeId;
	
	nlapiLogExecution('DEBUG', 'Transaction ID: ' + transId, 'Record Type: ' + transType);
	nlapiLogExecution('DEBUG', 'Nexus Country', nexusCountry);
	
	
	//Only Run on Create
	if (!isEmpty(transId)){//If Empty, Create mode, If Not Empty, Edit mode
		nlapiLogExecution('DEBUG', 'Edit Mode', 'Exit');
		return retVal;
	}
	
	
	//Only run for Invoices and Credit Memos
	if (transType != 'invoice' && transType != 'creditmemo'){
		return retVal;
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
				//nlapiSetLineItemValue('item', 'taxcode', i, taxCodeId);
				nlapiSelectLineItem('item', i);
				nlapiSetCurrentLineItemValue('item', 'taxcode', taxCodeId, true, true);
				nlapiCommitLineItem('item');
				
			}else{
				nlapiLogExecution('DEBUG', 'TaxCode is Already the Default Value on Line ' + i, 'No Update Needed');
			}
			
		}//End for i loop
		
		
	}//End if (!isEmpty(nexusCountry) && nexusCountry != 'US')
	
	
	return retVal;
	
		
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




