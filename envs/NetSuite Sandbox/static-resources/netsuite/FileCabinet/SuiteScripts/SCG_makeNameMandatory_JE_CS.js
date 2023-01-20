/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       09 Jul 2020     Doug Humberd     Makes 'Name' mandatory if Account Type = Accounts Payable or Accounts Receivable
 * 1.05       27 Oct 2020     Doug Humberd     Added 'is_mnm_makeCounterpartyMandatory'
 *
 */

/**
 * Constants
 */
//const MAILGUN_SAS = '12';//Mailgun SAS Subsidiary
//const MAILJET_SAS = '13';//Mailjet SAS Subsidiary
const TRANSFER_PRICING = '673';//Account: 48010 Transfer Pricing
const SALES_INTER_SERV = '674';//Account: 48020 Sales Intercompany Serv
const INTER_MGT = '675';//Account: 48030 Intercompany Management
const INTER_DEV = '676';//Account: 48040 Intercompany Developmen
const COGS_INTER_PROD_FEES = '702';//Account: 59010 COGS Intercompany Product fees
const COGS_INTER_SERV = '703';//Account: 59020 COGS Intercompany Services
const COGS_INTER_MGT_CHRGS = '704';//Account: 59030 COGS Intercompany Management Charges
const COGS_INTER_DEV_FEES = '705';//Account: 59040 COGS Intercompany Development Fees


 /**
 * Logs an exception to the script execution log
 *
 * @appliedtorecord journalentry advintercompanyjournalentry
 *
 * @param {String} e Exception
 * @returns {Void}
 */
function is_mnm_logError (e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error',
			e.getCode() + '\n' + e.getDetails());
		alert(e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
		alert(e.toString());
	}
}

/**
 * Performs actions once the page is fully loaded in the browser
 *
 * @param {String} type Operation types: create, copy, edit
 * @returns {Void}
 */
function is_mnm_pageInit (type) {
	try {
		//is_mnm_pageInitFunction(type);
	} catch (e) {
		is_mnm_logError(e);
		throw e;
	}
}

/**
 * Performs actions when a field is changed in the user's browser
 *
 * @appliedtorecord journalentry advintercompanyjournalentry
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_mnm_fieldChanged (type, name, linenum) {
	try {
		//is_mnm_fieldChangedFunction(type, name, linenum);
	} catch (e) {
		is_mnm_logError(e);
		throw e;
	}
}

/**
 * Performs actions following a field change after all of the field's
 * child field values are sourced from the server.
 *
 * @param {String} name The name of the field that changed
 * @param {String} type The sublist type
 * @returns {Void}
 */
function is_mnm_postSourcing (name, type) {
	try {
		//is_mnm_postSourcingFunction(name, type);
	} catch (e) {
		is_mnm_logError(e);
		throw e;
	}
}



/**
 * Performs actions prior to a line being added to a sublist
 *
 * @param {String} type - the sublist internal id
 * @returns {Void}
 */
function is_mnm_validateLine(type) {
	try {
		var retValue = false;
		//retValue = is_mnm_makeNameMandatory(type);
		//retValue = (retValue) ? is_mnm_makeCounterpartyMandatory(type) : false;
		retValue = is_mnm_makeCounterpartyMandatory(type);//TEMP LINE UNTIL makeNameMandatory IS DEPLOYED
		//retValue = (retValue) ? true /* replace with additional function_name() */ : false;
		//is_mnm_validateLineFunction(type);
		return retValue;
	} catch (e) {
		is_mnm_logError(e);
		throw e;
	}
}



/**
 * Performs actions after a line is added to a sublist
 *
 * @param {String} type - the sublist internal id
 * @returns {Void}
 */
function is_mnm_recalc(type) {
	try {
		//is_mnm_recalcFunction(type);
	} catch (e) {
		is_mnm_logError(e);
		throw e;
	}
}






/**
 * Handles validation prior to the form being submitted to the server
 *
 * @returns {Boolean}
 */
function is_mnm_saveRecord () {
	try {
		var retVal = false;
		//retVal = is_mnm_saveRecordFunction();
		//retVal = (retVal) ? true /* replace with additional function_name() */ : false;
		return retVal;
	} catch (e) {
		is_mnm_logError(e);
		throw e;
	}
}




function isEmpty (stValue) {
	if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
		return true;
	}

	return false;
}  



/**
 * Alerts user if the Name field is empty on a line where Account Type = Accounts Payable or Accounts Receivable
 *
 * @appliedtorecord journalentry advintercompanyjournalentry
 *
 */
function is_mnm_makeNameMandatory(type){
	
	var recType = nlapiGetRecordType();
	//alert ('Record Type = ' + recType);
	
	//if (subsidiary == MAILGUN_SAS || subsidiary == MAILJET_SAS){
		
		
		if (recType == 'journalentry' || recType == 'advintercompanyjournalentry'){
			
			//alert (recType + ' code');
			
			var acctType = nlapiGetCurrentLineItemValue('line', 'accounttype');
			//alert ('Account Type = ' + acctType);
			
			var name = nlapiGetCurrentLineItemValue('line', 'entity');
			
			if ((acctType == 'AcctRec' || acctType == 'AcctPay') && isEmpty(name)){

				alert ('\nName is Required for this line.\n\nPlease enter a value in the Name column.\n');
				
				retValue = false;
				return retValue;
				
			}//End if ((acctType == 'AcctRec' || acctType == 'AcctPay') && isEmpty(name))
			
		}//End if (recType == 'journalentry' || recType == 'advintercompanyjournalentry')
		
		
	//}//End if (subsidiary == MAILGUN_SAS || subsidiary == MAILJET_SAS)
	
	
	retValue = true;
	return retValue;
	
}






function is_mnm_makeCounterpartyMandatory(type){
	
	var recType = nlapiGetRecordType();
	//alert ('Record Type = ' + recType);
		
	if (recType == 'journalentry' || recType == 'advintercompanyjournalentry'){
		
		//alert (recType + ' code');
		
		var account = nlapiGetCurrentLineItemValue('line', 'account');
		//alert ('Account = ' + account);
		
		var cntrPty = nlapiGetCurrentLineItemValue('line', 'custcol_counterparty');
		
		if ((account == TRANSFER_PRICING || account == SALES_INTER_SERV || account == INTER_MGT || account == INTER_DEV || account == COGS_INTER_PROD_FEES || account == COGS_INTER_SERV || account == COGS_INTER_MGT_CHRGS || account == COGS_INTER_DEV_FEES) && isEmpty(cntrPty)){

			alert ('\nCounterparty is Required for this line.\n\nPlease enter a value in the Counterparty column.\n');
			
			retValue = false;
			return retValue;
			
		}//End if ((account == TRANSFER_PRICING || account == SALES_INTER_SERV || account == INTER_MGT || account == INTER_DEV || account == COGS_INTER_PROD_FEES || account == COGS_INTER_SERV || account == COGS_INTER_MGT_CHRGS || account == COGS_INTER_DEV_FEES) && isEmpty(cntrPty))
		
	}//End if (recType == 'journalentry' || recType == 'advintercompanyjournalentry')
		
	
	retValue = true;
	return retValue;
	
}





