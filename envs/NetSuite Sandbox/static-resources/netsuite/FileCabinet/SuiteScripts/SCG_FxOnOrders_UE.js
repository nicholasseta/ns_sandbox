/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       13 Apr 2022     Doug Humberd     Updates the "Exchange Rate" field when Order records are created
 * 	                          Doug Humberd     Updated to check for trandate - 1, and trandate - 2, if no Exchange Rate value is returned for trandate.  If no value after trandate - 2, default to 1/1/1970
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
//BASE_CURRENCY_ID = 4; // EUR
//BASE_CURRENCY_ID_USD = '1'; // USD
//DEFAULT_EFFECTIVE_DATE = '1/1/1970';


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord salesorder, invoice, returnauthorization, creditmemo, vendorbill, vendorcredit, cashrefund, cashsale, check, purchaseorder, and expensereport
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_foo_beforeLoad(type, form, request){
    try {
        //is_foo_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_foo_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord salesorder, invoice, returnauthorization, creditmemo, vendorbill, vendorcredit, cashrefund, cashsale, check, purchaseorder, and expensereport
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_foo_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        is_foo_setFxOnCreate(type);
    } catch (e) {
        is_foo_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord salesorder, invoice, returnauthorization, creditmemo, vendorbill, vendorcredit, cashrefund, cashsale, check, purchaseorder, and expensereport
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_foo_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        //is_foo_afterSubmitFunction(type);
    } catch (e) {
        is_foo_logError(e);
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
function is_foo_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



function is_foo_setFxOnCreate(type){
	
	//Only run on create
	//if (type != 'create' && type != 'edit'){
	if (type != 'create'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'Run Fx on Orders Code', 'START');
	
	//if (type == 'edit'){
		//var oldTransRec = nlapiGetOldRecord();
		//var oldEffDate = oldTransRec.getFieldValue('trandate');
		//nlapiLogExecution('DEBUG', 'Old Date', oldEffDate);
	//}
	
	//var effectiveDate = nlapiGetFieldValue('trandate');
	var effectiveDate = nlapiGetFieldValue('custrecord_is_ord_oppty_close_date');
	nlapiLogExecution('DEBUG', 'Opportunity Close Date', effectiveDate);
	
	var subsidiary = nlapiGetFieldValue('custrecord_is_ord_subsidiary');
	nlapiLogExecution('DEBUG', 'Subsidiary', subsidiary);
	
	//Only run in edit mode if the date has changed
	//if (type == 'edit' && effectiveDate == oldEffDate){
		//nlapiLogExecution('DEBUG', 'Edit Mode & Date Unchanged', 'RETURN');
		//return;
	//}
	
	
	//Determine if the record is an Expense Report or other
	//var transRec = nlapiGetNewRecord();
	//var transType = transRec.getRecordType();
	//nlapiLogExecution('DEBUG', 'Transaction Type', transType);
	
	//var baseCurrencyId = BASE_CURRENCY_ID;
	var baseCurrencyId = nlapiLookupField('subsidiary', subsidiary, 'currency');
	nlapiLogExecution('DEBUG', 'Subsidiary Currency', baseCurrencyId);
	//var baseCurrencyIdUSD = BASE_CURRENCY_ID_USD;

	
	//var transactionCurrencyId = nlapiGetFieldValue('currency');
	var transactionCurrencyId = nlapiGetFieldValue('custrecord_is_ord_currency');
	nlapiLogExecution('DEBUG', 'Order Currency', transactionCurrencyId);
	
	
	//baseCurrencyId = 5;//TEMP CODE FOR TESTING
	//transactionCurrencyId = 3;//TEMP CODE FOR TESTING
	
	
	//If Transaction Currency = Subsidiary Currency, set Exchange Rate = 1
	if (baseCurrencyId == transactionCurrencyId){
		nlapiLogExecution('DEBUG', 'Base Currency = Transaction Currency', 'Set Exch Rate = 1');
		var exchangeRate = 1;
		nlapiSetFieldValue('custrecord_is_ord_exchangerate', exchangeRate);
		return;
	}
	
	
	var exchangeRate = getExchangeRate(baseCurrencyId, transactionCurrencyId, effectiveDate);
	nlapiLogExecution('DEBUG', 'Exchange Rate', exchangeRate);
	
	//exchangeRate = '';//TEMP CODE FOR TESTING
	
	if (isEmpty(exchangeRate)){
		
		var maxDate = getMaxDate(baseCurrencyId, transactionCurrencyId);
		nlapiLogExecution('DEBUG', 'Max Date from Search', maxDate);
		
		if (maxDate){
			exchangeRate = getExchangeRate(baseCurrencyId, transactionCurrencyId, maxDate);
			nlapiLogExecution('DEBUG', 'Exchange Rate using Max Date', exchangeRate);
		}
		
	}
	
	/*
	if (isEmpty(exchangeRate)){
		effectiveDate = subtractDate(effectiveDate);
		nlapiLogExecution('DEBUG', 'effectiveDate minus 1', effectiveDate);
		exchangeRate = getExchangeRate(baseCurrencyId, transactionCurrencyId, effectiveDate);
		nlapiLogExecution('DEBUG', 'Exchange Rate', exchangeRate);
	}
	
	if (isEmpty(exchangeRate)){
		effectiveDate = subtractDate(effectiveDate);
		nlapiLogExecution('DEBUG', 'effectiveDate minus 2', effectiveDate);
		exchangeRate = getExchangeRate(baseCurrencyId, transactionCurrencyId, effectiveDate);
		nlapiLogExecution('DEBUG', 'Exchange Rate', exchangeRate);
	}
	
	if (isEmpty(exchangeRate)){
		effectiveDate = nlapiDateToString(new Date(DEFAULT_EFFECTIVE_DATE));
		nlapiLogExecution('DEBUG', 'effectiveDate default', effectiveDate);
		exchangeRate = getExchangeRate(baseCurrencyId, transactionCurrencyId, effectiveDate);
		nlapiLogExecution('DEBUG', 'Exchange Rate', exchangeRate);
	}
	*/
	
	//Set the Exchange Rate value
	nlapiSetFieldValue('custrecord_is_ord_exchangerate', exchangeRate);
	
	
}



function subtractDate(effectiveDate){
	
	var dateFormat = nlapiGetContext().getPreference('DATEFORMAT');
	//nlapiLogExecution('DEBUG', 'Date Format', dateFormat);  DD/MM/YYYY
	
	var date = '';
	//date = new Date(effectiveDate);
	date = nlapiStringToDate(effectiveDate, 'datetime');
	date.setDate(date.getDate() - 1);
	
	//nlapiLogExecution('DEBUG', 'New Date', date)
	
	//var month = date.getMonth();
	//month = month + 1;
	//var year = date.getFullYear();
	//var day = date.getDate();
	
	//var dateMinusOne = month + '/' + day + '/' + year;
	var dateMinusOne = nlapiDateToString(date, 'date');
	nlapiLogExecution('DEBUG', 'New Date Formatted', dateMinusOne);
	
	return dateMinusOne;
	
}



function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}


