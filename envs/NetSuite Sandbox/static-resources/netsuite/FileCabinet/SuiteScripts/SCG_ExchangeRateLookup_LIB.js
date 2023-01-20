/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       Original        Doug Humberd     Gets "Exchange Rate"
 * 1.05       13 Apr 2022     Doug Humberd     Added "getMaxDate" (used by "order" records only)
 *
 */




/**
 * Lookup an exchange rate for a given date
 *
 * @appliedtorecord currencyrate
 *
 * @param {Integer} baseCurrencyId The internal id of the base currency (USD = 1)
 * @param {Integer} transactionCurrencyId The internal id of the base currency (GBP = 2)
 * @param {String} effectiveDate The internal id of the outgoing Integration record
 *
 * @returns {String}
 */
function getExchangeRate(baseCurrencyId, transactionCurrencyId, effectiveDate) {
    // Initialize variables
    var exchangeRate = '';
    
    // Defaine filters
    var filters = [];
    filters.push(new nlobjSearchFilter('basecurrency', null, 'anyof', baseCurrencyId));
    filters.push(new nlobjSearchFilter('transactioncurrency', null, 'anyof', transactionCurrencyId));
    filters.push(new nlobjSearchFilter('effectivedate', null, 'on', effectiveDate));

    // Define columns
    var columns = [];
    columns.push(new nlobjSearchColumn('exchangerate', null, null));

    // Run search
    var searchResults = nlapiSearchRecord('currencyrate', null, filters, columns);
    
    // Return result
    exchangeRate = (searchResults && searchResults.length > 0) ? searchResults[0].getValue('exchangerate', null, null) : null;
    return exchangeRate;
}




function getMaxDate(baseCurrencyId, transactionCurrencyId){
	
	// Initialize variables
    var maxDate = '';
    
    // Defaine filters
    var filters = [];
    filters.push(new nlobjSearchFilter('basecurrency', null, 'anyof', baseCurrencyId));
    filters.push(new nlobjSearchFilter('transactioncurrency', null, 'anyof', transactionCurrencyId));

    // Define columns
    var columns = [];
    columns.push(new nlobjSearchColumn('effectivedate', null, 'MAX'));

    // Run search
    var searchResults = nlapiSearchRecord('currencyrate', null, filters, columns);
    
    // Return result
    maxDate = (searchResults && searchResults.length > 0) ? searchResults[0].getValue('effectivedate', null, 'MAX') : null;
    return maxDate;
	
}