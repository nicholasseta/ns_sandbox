/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       25 Jul 2022     Doug Humberd     Updates the "Amount in USD" field based on the Exchange Rate Value for the trandate - Runs on Purchase Order records (for PO Approval WF 2.0)
 *                            Doug Humberd     Check for trandate - 1, and trandate - 2, if no Exchange Rate value is returned for trandate.  If no value after trandate - 2, default to 1/1/1970
 * 1.01       27 Jul 2022     Doug Humberd     Updated to also run in Edit Mode if Amount in USD is empty
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
//BASE_CURRENCY_ID = 4; // EUR
BASE_CURRENCY_ID_USD = '1'; // USD
DEFAULT_EFFECTIVE_DATE = '1/1/1970';


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord purchaseorder
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_f2u_beforeLoad(type, form, request){
    try {
        //is_f2u_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_f2u_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord purchaseorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_f2u_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        is_f2u_Fx2USD(type);
    } catch (e) {
        is_f2u_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord purchaseorder
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_f2u_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        //is_f2u_afterSubmitFunction(type);
    } catch (e) {
        is_f2u_logError(e);
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
function is_f2u_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



function is_f2u_Fx2USD(type){
	
	//Only run on create and edit
	if (type != 'create' && type != 'edit'){
		return;
	}
	
	if (type == 'edit'){
		var oldTransRec = nlapiGetOldRecord();
		var oldEffDate = oldTransRec.getFieldValue('trandate');
		nlapiLogExecution('DEBUG', 'Old Date', oldEffDate);
		var oldAmount = oldTransRec.getFieldValue('total');
		nlapiLogExecution('DEBUG', 'Old Amount', oldAmount);
	}
	
	var effectiveDate = nlapiGetFieldValue('trandate');
	nlapiLogExecution('DEBUG', 'Date', effectiveDate);
	
	var amount = nlapiGetFieldValue('total');
	nlapiLogExecution('DEBUG', 'Amount', amount);
	
	var amtInUSD = nlapiGetFieldValue('custbody_scg_amt_in_usd');
	nlapiLogExecution('DEBUG', 'Current Amount in USD Value', amtInUSD);
	
	//Only run in edit mode if the date has changed or if amount has changed
	//Also run if Amount in USD is empty
	if (type == 'edit' && (effectiveDate == oldEffDate && amount == oldAmount && !isEmpty(amtInUSD))){
		nlapiLogExecution('DEBUG', 'Edit Mode & Date/Amount Unchanged', 'RETURN');
		return;
	}
	
	nlapiLogExecution('DEBUG', 'Run Fx to USD Code', 'START');
	
	//var baseCurrencyId = BASE_CURRENCY_ID;
	var baseCurrencyIdUSD = BASE_CURRENCY_ID_USD;
	
	
	var transactionCurrencyId = nlapiGetFieldValue('currency');
	nlapiLogExecution('DEBUG', 'Currency', transactionCurrencyId);
		
		
	//***** Exchange Rate to USD Logic *****
	nlapiLogExecution('DEBUG', 'Exch Rate USD', 'Start Here');
	//nlapiLogExecution('DEBUG', 'baseCurrencyIdUSD', baseCurrencyIdUSD);
	//nlapiLogExecution('DEBUG', 'transactionCurrencyId', transactionCurrencyId);
	
	//Reset Effective Date
	//effectiveDate = nlapiGetFieldValue('trandate');
	
	//nlapiLogExecution('DEBUG', 'effectiveDate', effectiveDate);
	
	var exchangeRateUSD = getExchangeRate(baseCurrencyIdUSD, transactionCurrencyId, effectiveDate);
	nlapiLogExecution('DEBUG', 'Exchange Rate USD', exchangeRateUSD);

	if (isEmpty(exchangeRateUSD)){
		effectiveDate = subtractDate(effectiveDate);
		nlapiLogExecution('DEBUG', 'effectiveDate minus 1', effectiveDate);
		exchangeRateUSD = getExchangeRate(baseCurrencyIdUSD, transactionCurrencyId, effectiveDate);
		nlapiLogExecution('DEBUG', 'Exchange Rate USD', exchangeRateUSD);
	}
	
	if (isEmpty(exchangeRateUSD)){
		effectiveDate = subtractDate(effectiveDate);
		nlapiLogExecution('DEBUG', 'effectiveDate minus 2', effectiveDate);
		exchangeRateUSD = getExchangeRate(baseCurrencyIdUSD, transactionCurrencyId, effectiveDate);
		nlapiLogExecution('DEBUG', 'Exchange Rate USD', exchangeRateUSD);
	}
	
	if (isEmpty(exchangeRateUSD)){
		effectiveDate = nlapiDateToString(new Date(DEFAULT_EFFECTIVE_DATE));
		nlapiLogExecution('DEBUG', 'effectiveDate default', effectiveDate);
		exchangeRateUSD = getExchangeRate(baseCurrencyIdUSD, transactionCurrencyId, effectiveDate);
		nlapiLogExecution('DEBUG', 'Exchange Rate USD', exchangeRateUSD);
	}
	
	//Set the Exchange Rate To USD value
	//nlapiSetFieldValue('custbody_exchange_rate_to_usd', exchangeRateUSD);	
	
	
	//Calculate and Set 'Amount in USD'
	var transAmt = nlapiGetFieldValue('total');
	var amtInUSD = Number(transAmt) * exchangeRateUSD;
	nlapiLogExecution('DEBUG', 'Amount in USD', amtInUSD);
	nlapiSetFieldValue('custbody_scg_amt_in_usd', amtInUSD);
	
	
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


