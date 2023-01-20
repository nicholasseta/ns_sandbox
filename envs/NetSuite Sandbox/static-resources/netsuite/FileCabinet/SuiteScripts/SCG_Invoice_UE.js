/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       17 May 2018     Doug Humberd     Handles user events on Invoice records
 * 1.10       28 Sep 2018     Doug Humberd     Added functionality to pull multiple email addresses from customer record, if createdfrom is empty
 * 1.20       01 Oct 2018     Doug Humberd     Added functionality to copy value from Contract Start Date -> Due Date field on invoice create
 * 1.30       01 Oct 2018     Doug Humberd     Added functionality to set the Remittance Information value on an Invoice
 * 1.40       31 Oct 2018     Doug Humberd     Updated "is_inv_setDueDate" to only run if Order Type = Renewal, and set Terms = Due on Receipt if Contract Start Date is before today
 * 1.50       05 Dec 2018     Doug Humberd     Commented out afterSubmit function "scg_ra_updateRevenueArrangement" - moved to alternate script "SCG_UpdateRevenueArrangement_UE" so can employ multiple deployments
 * 1.60       26 Mar 2019     Doug Humberd     Added afterSubmit function "is_inv_updRecordStatus" to update the record status field on the invoice
 * 1.70       28 Mar 2019     Doug Humberd     Updated 'is_inv_updRecordStatus' to include scenarios for Journal Entries
 * 1.80       02 Apr 2019     Doug Humberd     Updated 'is_inv_updRecordStatus' to simplify the number of values available in the Record Status field (list)
 * 1.90		  19 Oct 2019	  Scott Stanell	   Added PDF functionality
 * 1.95       18 Nov 2019     Doug Humberd     Updated "is_inv_setDueDate" to not run function if month-to-month is checked on the Invoice
 * 2.00       20 Jan 2020     Doug Humberd     Added 'is_inv_revCharge' for Reverse Charge functionality
 * 2.05       21 Jan 2020     Doug Humberd     Updated 'is_inv_setRemittance' to set Remittance Value if only Subsidiary matches, not Currency
 * 2.10       14 Apr 2020     Doug Humberd     Added BL function "is_inv_calcValuesSchedScript"
 * 2.15       03 Jun 2020     Doug Humberd     Added 'is_inv_updQtyForCust(type)'
 * 2.20       11 Jun 2020     Doug Humberd     Updated 'is_inv_setDueDate' with new requirements per Vicky
 * 2.25       28 Sep 2020     Doug Humberd     Updated 'is_inv_setDueDate' with new requirements per Vicky (and Megan) email
 * 2.26       03 Dec 2020     Matt Poloni      Updated 'is_inv_revCharge' to declare euCountrySub and euCountryShip variables that were blocking invoice creation
 * 2.27       14 Oct 2021     Doug Humberd     Commented out is_inv_revCharge - moved to standalone script
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const ORDER_TYPE_RENEWAL = '3';
const DUE_ON_RECEIPT = '4';


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_inv_beforeLoad(type, form, request){
    try {
        //is_inv_beforeLoadScript(type, form, request);
    } catch (e) {
        is_inv_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_inv_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        is_inv_setRemittance(type);
        //is_inv_revCharge(type);//MOVED TO STANDALONE SCRIPT - SCG_ReversedCharge_UE
        //is_inv_updQtyForCust(type);
    } catch (e) {
        is_inv_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_inv_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        //scg_ra_updateRevenueArrangement(type);
        is_inv_setToBeEmailedValue(type);
        is_inv_setDueDate(type);
        is_inv_updRecordStatus(type);      	
      	scg_inv_setPdfFields(type);
      	print_invoice_html(type);
    } catch (e) {
        is_inv_logError(e);
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
function is_inv_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



/**
 * Sets the email field with the Multiple Invoice Email value pulled from the customer record, only if the createdfrom value is empty
 *
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_inv_setToBeEmailedValue(type){
	
	//Only run on create
	if (type != 'create'){
		return;
	}
	
	var invRec = nlapiGetNewRecord();
	var invId = invRec.getId();
	var custId = nlapiGetFieldValue('entity');
	var multEmail = nlapiLookupField('customer', custId, 'custentity_scg_mult_inv_emails');
	
	nlapiLogExecution('DEBUG', 'Invoice ID', invId);
	nlapiLogExecution('DEBUG', 'Customer', custId);
	nlapiLogExecution('DEBUG', 'Multiple Email Field', multEmail);
	
	//If the Multiple Email field is empty, exit
	if (isEmpty(multEmail)){
		return;
	}
	
	var createdFrom = invRec.getFieldValue('createdfrom');
	
	//Only run if createdfrom is Empty
	if (isEmpty(createdFrom)){
		
		nlapiLogExecution('DEBUG', 'No createdfrom.  Update Invoice', 'UPDATED');
		var invoice = nlapiLoadRecord('invoice', invId);
		invoice.setFieldValue('email', multEmail);
		nlapiSubmitRecord(invoice);
		
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
 * Copies the value from 'Contract Start Date' to 'Due Date' on create
 *
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_inv_setDueDate(type){
	
	//Run on Create
	if (type != 'create'){
	//if (type != 'create' && type != 'edit'){
		return;
	}
	
	//Only run if Order Type = Renewal
	if (nlapiGetFieldValue('custbody_so_ordertype') != ORDER_TYPE_RENEWAL){
		nlapiLogExecution('DEBUG', 'Order Type != Renewal', 'RETURN');
		return;
	}
	
	nlapiLogExecution('DEBUG', 'setDueDate', 'START');
	
	var contrStartDate = nlapiGetFieldValue('custbody_contract_start_date');
	nlapiLogExecution('DEBUG', 'Contract Start Date', contrStartDate);
	var contrStartDateObj = new Date(contrStartDate);
	
	var monthToMonth = nlapiGetFieldValue('custbody_month_to_month_contract');
	nlapiLogExecution('DEBUG', 'Month to Month Contract', monthToMonth);
	
	if (!isEmpty(contrStartDate)){
		
		var inv = nlapiGetNewRecord();
		var invId = inv.getId();
		//nlapiLogExecution('DEBUG', 'Invoice ID', invId);
		
		//If Contract Start Date is before or equal to today, set terms = Due on Receipt
		var today = new Date();
		//var today = nlapiDateToString(new Date(), 'date');
		nlapiLogExecution('DEBUG', 'today', today);
		
		var plus30 = new Date();
		plus30.setDate(plus30.getDate() + 30);
		nlapiLogExecution('DEBUG', 'Today Plus 30 Object', plus30);
		var todayPlus30 = nlapiDateToString(plus30, 'date');
		nlapiLogExecution('DEBUG', 'Today Plus 30 Date', todayPlus30);
		nlapiLogExecution('DEBUG', 'Today Again', today);
		var invRec = nlapiLoadRecord('invoice', invId);
		
		//Only update Due Date if Month to Month Contract is not checked
		if (monthToMonth == 'F'){
			
			//if (contrStartDateObj <= today){
			if (contrStartDateObj <= plus30){
				//nlapiLogExecution('DEBUG', 'Contract Start Date ' + contrStartDate, 'BEFORE or EQUAL TO Today ' + today);
				nlapiLogExecution('DEBUG', 'Contract Start Date ' + contrStartDate, 'BEFORE or EQUAL TO Today + 30 ' + plus30);
				invRec.setFieldValue('duedate', todayPlus30);
				invRec.setFieldValue('terms', DUE_ON_RECEIPT);
			}else{
				//nlapiLogExecution('DEBUG', 'Contract Start Date ' + contrStartDate, 'AFTER Today ' + today);
				nlapiLogExecution('DEBUG', 'Contract Start Date ' + contrStartDate, 'AFTER Today + 30 ' + plus30);
				invRec.setFieldValue('duedate', contrStartDate);
				invRec.setFieldValue('terms', DUE_ON_RECEIPT);
			}
			
			
		}
		
		//if (contrStartDateObj <= today){
			//nlapiLogExecution('DEBUG', 'Contract Start Date ' + contrStartDate, 'BEFORE or EQUAL TO Today ' + today);
			//invRec.setFieldValue('terms', DUE_ON_RECEIPT);
		//}
		
		nlapiSubmitRecord(invRec);
		
	}
	
	nlapiLogExecution('DEBUG', 'setDueDate', 'END');
	
}




/**
 * Sets the Remittance Information value on the Invoice.
 *
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_inv_setRemittance(type){
	
	// Only run on create
    //if (type != 'create' && type != 'edit'){//REMOVE EDIT AFTER TESTING
	if (type != 'create'){
    	return;
    }

    
    // Initialize variables
    var gotAhit = 'F';
    var currency = nlapiGetFieldValue('currency');
    var subsidiary = nlapiGetFieldValue('subsidiary');
    
	//Generate Search Results to cycle through Remittance Information record
	var remittanceRecs = getRemittanceRecs(subsidiary);
	
	if (remittanceRecs){
		
		// Loop through the array to determine and update Remittance value
		for (var i = 0; i < remittanceRecs.length; i++){
				
			var remitId = remittanceRecs[i].getValue('internalid');
			var remitName = remittanceRecs[i].getValue('name');
			var remitCurrency = remittanceRecs[i].getValue('custrecord_currency');
			var remitSubsidiary = remittanceRecs[i].getValue('custrecord_subsidiary');
			//nlapiLogExecution('DEBUG', 'Remit ID', remitId);
			//nlapiLogExecution('DEBUG', 'Remit Name', remitName);
			//nlapiLogExecution('DEBUG', 'Remit Currency', remitCurrency);
			//nlapiLogExecution('DEBUG', 'Remit Subsidiary', remitSubsidiary);
			
			if (remitCurrency === currency && remitSubsidiary === subsidiary){
				nlapiLogExecution('DEBUG', 'Got a Hit!', currency + ' ' + remitCurrency);
				nlapiLogExecution('DEBUG', 'Got a Hit!', subsidiary + ' ' + remitSubsidiary);
				nlapiLogExecution('DEBUG', 'ID Found', remitId);
				gotAhit = 'T';
				nlapiSetFieldValue('custbody_remittance_information', remitId);
				break;
			}
				
		}//End for i loop
		
		if (gotAhit == 'F'){
			
			// Loop through the array again to determine if any matches of Subsidiary Only, with empty Currency, and update Remittance value
			for (var x = 0; x < remittanceRecs.length; x++){
					
				var remitId = remittanceRecs[x].getValue('internalid');
				var remitName = remittanceRecs[x].getValue('name');
				var remitCurrency = remittanceRecs[x].getValue('custrecord_currency');
				var remitSubsidiary = remittanceRecs[x].getValue('custrecord_subsidiary');
				//nlapiLogExecution('DEBUG', 'Remit ID', remitId);
				//nlapiLogExecution('DEBUG', 'Remit Name', remitName);
				//nlapiLogExecution('DEBUG', 'Remit Currency', remitCurrency);
				//nlapiLogExecution('DEBUG', 'Remit Subsidiary', remitSubsidiary);
				
				if (isEmpty(remitCurrency) && remitSubsidiary === subsidiary){
					nlapiLogExecution('DEBUG', 'Currency Empty', remitCurrency);
					nlapiLogExecution('DEBUG', 'Got a Hit!', subsidiary + ' ' + remitSubsidiary);
					nlapiLogExecution('DEBUG', 'ID Found', remitId);
					nlapiSetFieldValue('custbody_remittance_information', remitId);
					break;
				}
					
			}//End for x loop
			
		}//End if (gotAhit == 'F')
		
	}//End if (remittanceRecs)
	
}




function getRemittanceRecs(subsidiary){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_subsidiary', null, 'anyof', subsidiary));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('name', null, null));
	columns.push(new nlobjSearchColumn('custrecord_subsidiary', null, null));
	columns.push(new nlobjSearchColumn('custrecord_currency', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('customrecord_remittance_information', null, filters, columns);
	  
	// Return
	return results;
	
}



/**
 * Updates the Record Status field on the invoice record.
 *
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_inv_updRecordStatus(type){
	
	//Run on create, edit
	if (type != 'create' && type != 'edit'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'Run Type', type);
	
	//Initialize Variables
	var invRec = nlapiGetNewRecord();
	var invId = invRec.getId();
	nlapiLogExecution('DEBUG', 'Invoice Id', invId);
	
	var cmFound = 'N';
	var payFound = 'N';
	var jeFound = 'N';
	
	var searchresults = is_getPayingTransactionValues(invId);
	
	if (searchresults){
		
		for (var i = 0; i < searchresults.length; i++){
			
			var payTransaction = searchresults[i].getValue('payingtransaction');
			var payTransactionText = searchresults[i].getText('payingtransaction');
			//nlapiLogExecution('DEBUG', 'Paying Transaction line ' + i, payTransaction);
			nlapiLogExecution('DEBUG', 'Paying Trans Text line ' + i, payTransactionText);
			
			if (payTransactionText.indexOf('Credit Memo') != -1){
				cmFound = 'Y';
			}
			
			if (payTransactionText.indexOf('Payment') != -1){
				payFound = 'Y';
			}
			
			if (payTransactionText.indexOf('Journal') != -1){
				jeFound = 'Y';
			}
			
		}
		
		nlapiLogExecution('DEBUG', 'cmFound', cmFound);
		nlapiLogExecution('DEBUG', 'payFound', payFound);
		nlapiLogExecution('DEBUG', 'jeFound', jeFound);
			
	}
	
	var recStatus = '1';//1 = Inv: Open
	
	if (cmFound == 'Y' && payFound == 'N' && jeFound == 'N'){
		recStatus = '2';//2 = Inv: Credit Applied
	}
	else if (cmFound == 'N' && payFound == 'Y' && jeFound == 'N'){
		recStatus = '3';//3 = Inv: Payment Applied
	}
	else if (cmFound == 'N' && payFound == 'N' && jeFound == 'Y'){
		recStatus = '4';//4 = Inv: Journal Applied
	}
	else if (cmFound == 'Y' && payFound == 'Y' && jeFound == 'N'){
		recStatus = '5';//5 = Inv: Credit and Payment Applied
	}
	else if (cmFound == 'Y' && payFound == 'N' && jeFound == 'Y'){
		recStatus = '6';//6 = Inv: Credit and Journal Applied
	}
	else if (cmFound == 'N' && payFound == 'Y' && jeFound == 'Y'){
		recStatus = '34';//34 = Inv: Payment and Journal Applied
	}
	else if (cmFound == 'Y' && payFound == 'Y' && jeFound == 'Y'){
		recStatus = '35';//35 = Inv: Credit, Payment, and Journal Applied
	}
	
	nlapiLogExecution('DEBUG', 'Set Record Status to:', recStatus);
	
	var currRecStatus = invRec.getFieldValue('custbody_scg_record_status');
	
	if (isEmpty(currRecStatus) || currRecStatus != recStatus){
		
		var invoiceRec = nlapiLoadRecord('invoice', invId, {recordmode: 'dynamic'});
		invoiceRec.setFieldValue('custbody_scg_record_status', recStatus);
		nlapiSubmitRecord(invoiceRec);
		
	}
}




/**
 * Returns a list of paying transaction values for a given invoice record
 * 
 * @appliedtorecord customrecord_scg_emp_processing_queue
 * 
 * @returns {nlobjSearch}
 */
function is_getPayingTransactionValues(invId){
	// Define filters
	var filters = new Array();
	//filters.push(new nlobjSearchFilter('type', null, 'anyof', 'invoice'));
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', invId));

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('payingtransaction', null, null));

	return nlapiSearchRecord('invoice', null, filters, columns);
}


/**
 * Adds a PDF as a base64-encoded string to a custom field on the Invoice record
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function scg_inv_setPdfFields(type) {
  // Only continue for new and edited transactions
  if (type != 'create' && type != 'edit' && type != 'xedit')
    return;

  // Initialize variables
  var invId = nlapiGetRecordId();

  // Set or update the PDF Base64 field
  var file = nlapiPrintRecord('TRANSACTION', invId, 'PDF', null);
  nlapiSubmitField('invoice', invId, 'custbody_pdf_base64_content', file.getValue());
}





function is_inv_revCharge(type){
	
	//Run on create and edit
	if (type != 'create' && type != 'edit'){
		return;
	}
	
	var subsidiary = nlapiGetFieldValue('subsidiary');
	var subCountry = nlapiLookupField('subsidiary', subsidiary, 'country');
	var shipCountry = nlapiGetFieldValue('shipcountry_insubrecord');
	
	nlapiLogExecution('DEBUG', 'Subsidiary: ' + subsidiary, 'Subsidiary Country: ' + subCountry);
	nlapiLogExecution('DEBUG', 'Ship Country', shipCountry);
	
	if (subCountry != shipCountry){
		
		nlapiLogExecution('DEBUG', 'Subsidiary Country != Ship Country', 'CONTINUE');
		
		var searchresults = isEuropeanCountry(subCountry);
		
		//Check if Subsidiary Country is EU
		if (searchresults){
			
			//for (var i = 0; i < searchresults.length; i++){
			var euCountrySub = searchresults[0].getValue('custrecord_ec');
			//}
			
		}
		
		//Check if Ship Country is EU
		var searchresults2 = isEuropeanCountry(shipCountry);
		
		if (searchresults2){
			
			//for (var i = 0; i < searchresults.length; i++){
			var euCountryShip = searchresults[0].getValue('custrecord_ec');
			//}
			
		}
		
		nlapiLogExecution('DEBUG', 'Subsidiary EU: ' + euCountrySub, 'Ship EU: ' + euCountryShip);
		
		//If both Subsidiary Country and Ship Country are EU, then check Reversed Charge, else uncheck
		if (euCountrySub == 'T' && euCountryShip == 'T'){
			nlapiSetFieldValue('custbody_reversed_charge', 'T');
		}else{
			nlapiSetFieldValue('custbody_reversed_charge', 'F');
		}
		
	}else{//End if (subCountry != shipCountry)
		nlapiSetFieldValue('custbody_reversed_charge', 'F');
	}
	
}



function isEuropeanCountry(country){
	
	//Define filters
	var filters = new Array();
	//filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_cr_country_code', null, 'is', country));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('custrecord_ec', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('customrecord_countries_regions', null, filters, columns);
	  
	// Return
	return results;
	
}






function is_inv_updQtyForCust(type){
	
	if (type != 'create' && type != 'edit'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'updQtyForCust', 'START');
	
	var createdFrom = nlapiGetFieldValue('createdfrom');
	var OA_invoice = nlapiGetFieldValue('custbody_oa_invoice_number');
	nlapiLogExecution('DEBUG', 'created from = ' + createdFrom, 'OA Invoice Number = ' + OA_invoice);
	
	if (isEmpty(createdFrom) && !isEmpty(OA_invoice)){
		
		var itemCount = nlapiGetLineItemCount('item');
		
		for (var i = 1; i <= itemCount; i++){
			
			var quantity = nlapiGetLineItemValue('item', 'quantity', i);
			
			nlapiLogExecution('DEBUG', 'Set Qty for Cust Line ' + i, quantity);
			nlapiSetLineItemValue('item', 'custcol_quantity_for_customer', i, quantity);
			
		}//End for i loop
		
	}//End if (isEmpty(createdFrom) && !isEmpty(OA_invoice))
	
}




