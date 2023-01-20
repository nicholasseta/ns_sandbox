/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       23 Aug 2018     Doug Humberd     Updates the "Exchange Rate to Euro" field based on the EUR Exchange Rate Value for the trandate - Runs on SO, Invoice, Ret Auth, Credit Memo, Vendor Bill, and Vendor Credit records
 * 1.10       27 Aug 2018     Doug Humberd     Updated to check for trandate - 1, and trandate - 2, if no Exchange Rate value is returned for trandate.  If no value after trandate - 2, default to 1/1/1970
 * 1.20       12 Sep 2018     Doug Humberd     Updated to check for transaction type.  If expense report, write Exch Rate to Euro value to appropriate line item, not report body field.
 * 1.30       19 Sep 2018     Doug Humberd     Updated "subtractDate" function to handle different date formats
 * 1.40       22 Oct 2018     Doug Humberd     Updated to calculate the 'DEFAULT_EFFECTIVE_DATE' based on user's date preference
 * 1.50       22 Feb 2019     Doug Humberd     Updated to only run in edit mode if the trandate value has changed in an effort to optimize performance
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
BASE_CURRENCY_ID = 4; // EUR
DEFAULT_EFFECTIVE_DATE = '1/1/1970';


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
function is_f2e_beforeLoad(type, form, request){
    try {
        //is_f2e_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_f2e_logError(e);
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
function is_f2e_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        is_f2e_Fx2Euro(type);
    } catch (e) {
        is_f2e_logError(e);
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
function is_f2e_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        //is_f2e_afterSubmitFunction(type);
    } catch (e) {
        is_f2e_logError(e);
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
function is_f2e_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



function is_f2e_Fx2Euro(type){
	
	//Only run on create and edit
	if (type != 'create' && type != 'edit'){
		return;
	}
	
	if (type == 'edit'){
		var oldTransRec = nlapiGetOldRecord();
		var oldEffDate = oldTransRec.getFieldValue('trandate');
		nlapiLogExecution('DEBUG', 'Old Date', oldEffDate);
	}
	
	var effectiveDate = nlapiGetFieldValue('trandate');
	nlapiLogExecution('DEBUG', 'Date', effectiveDate);
	
	//Only run in edit mode if the date has changed
	if (type == 'edit' && effectiveDate == oldEffDate){
		nlapiLogExecution('DEBUG', 'Edit Mode & Date Unchanged', 'RETURN');
		return;
	}
	
	nlapiLogExecution('DEBUG', 'Run Fx to Euro Code', 'START');
	
	//Determine if the record is an Expense Report or other
	var transRec = nlapiGetNewRecord();
	var transType = transRec.getRecordType();
	nlapiLogExecution('DEBUG', 'Transaction Type', transType);
	
	var baseCurrencyId = BASE_CURRENCY_ID;
	
	if (transType == 'expensereport'){
		
		var expCount = nlapiGetLineItemCount('expense');
		nlapiLogExecution('DEBUG', 'Expense Count', expCount);
		
		for(var i = 1; i <= expCount; i++){
			
			var transactionCurrencyId = nlapiGetLineItemValue('expense', 'currency', i);
			nlapiLogExecution('DEBUG', 'Currency', transactionCurrencyId);
			
			var exchangeRate = getExchangeRate(baseCurrencyId, transactionCurrencyId, effectiveDate);
			nlapiLogExecution('DEBUG', 'Exchange Rate', exchangeRate);

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
			
			//Set the Exchange Rate To Euro value
			//nlapiSetFieldValue('custbody_exchange_rate_to_euro', exchangeRate);
			nlapiSetLineItemValue('expense', 'custcol_scg_exch_rate_to_euro', i, exchangeRate);
			
		}//End for loop
		
	}else{//Transaction Type is NOT expensereport
		
		var transactionCurrencyId = nlapiGetFieldValue('currency');
		nlapiLogExecution('DEBUG', 'Currency', transactionCurrencyId);
		
		var exchangeRate = getExchangeRate(baseCurrencyId, transactionCurrencyId, effectiveDate);
		nlapiLogExecution('DEBUG', 'Exchange Rate', exchangeRate);

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
		
		//Set the Exchange Rate To Euro value
		nlapiSetFieldValue('custbody_exchange_rate_to_euro', exchangeRate);

	}
	
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


