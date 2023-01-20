/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       02 Nov 2018     Doug Humberd     Sets the Tax Code Value to "Avatax" for Invoices, Sales Orders and Credit Memos when
 *                                             Subsidiary = Global Software LLC or InsightSoftware, Inc and
 *                                             If Ship Country = US 
 * 1.10       02 Dec 2018     Doug Humberd     Updated to set Tax Code Value to "OS-AU" if Subsidiary Country = Australia and Ship Country is NOT Australia
 * 1.20       12 Dec 2018     Doug Humberd     Updated to run 'is_avatax_setTaxCodeAvatax' as a beforeSubmit function, not afterSubmit.  Also set to only run on create.
 * 1.30       17 Dec 2018     Doug Humberd     Updated to test for subsidiary "Excel4apps Inc." (AVATAX)
 * 1.40       18 Dec 2018     Doug Humberd     Updated to run 'is_avatax_setTaxCodeAvatax' as a afterSubmit function again, not beforeSubmit, to resolve issue of tax rate not recalculating when tax code is updated by webservices
 * 1.50       31 Dec 2018     Doug Humberd     Updated 'is_avatax_setTaxCodeAvatax' function to use "nlapiSetCurrentLineItemValue" as opposed to "nlapiSetLineItemValue", as the tax rate has not been getting updated when tax code is set
 * 1.60       22 Jan 2019     Doug Humberd     Updated OS-AU code to execute on edit, but only if the "Check OS-AU" field is checked
 * 1.70       18 Feb 2019     Doug Humberd     Updated to run 'is_avatax_setTaxCodeAvatax' as a beforeSubmit function, not afterSubmit.  Tax Rate not updating with afterSubmit.  Checking "Execute in Commerce Context" on deployment record to see if tax code gets updated when created by webservices
 * 1.80       09 Aug 2019     Doug Humberd     Update Avatax code to no longer check for specific subsidiaries, but rather update if Subsidiary Country = US and if Ship Country = US
 * 1.90       29 Aug 2019     Doug Humberd     Added code to check for Denmark Subsidiary, and to add appropriate tax codes as necessary
 * 2.00       25 Sep 2019     Doug Humberd     Added code to check for UK Subsidiary, and to add appropriate tax codes as necessary
 *                                             Remove AU Code per Cherrie - going to use NetSuite to assign the Tax Codes
 * 2.10       21 Jan 2020     Doug Humberd     Added code to check for Sweden and Norway Subsidiaries, and to add appropriate tax codes as necessary
 * 2.15       28 Jan 2020     Doug Humberd     Added additional tax codes/logic for Sweden and Norway
 * 2.20       29 Jan 2020     Doug Humberd     Added additional tax codes/logic for Australia, Denmark, Ireland, Netherlands, New Zealand, South Africa, United Kingdom
 * 2.25       13 Mar 2020     Doug Humberd     Updated to not run if 'Data Migration' is checked
 * 
 * 2.35       01 Apr 2020     Doug Humberd     Added functionality to update Tax Codes beforeSubmit if custom 'Update Tax Codes' is checked (checked in CS field when Shipping Country is modified)
 * 2.40       23 Apr 2020     Doug Humberd     Added additional tax codes/logic for Switzerland and Germany
 * 2.41       30 Apr 2020     Doug Humberd     Updated - all "OS_" codes (except AU) replaced with "O_" versions
 * 2.45       20 May 2020     Doug Humberd     Added additional tax codes/logic for Canada
 * 2.50       12 Jun 2020     Doug Humberd     Updated all Eur Country Sales/Resales to use "ESSS" version of tax code
 * 2.55       26 Jun 2020     Doug Humberd     Updated Germany Tax Codes to use different codes if Transaction Date is between 7/1 and 12/31/20
 * 2.60       08 Jul 2020     Doug Humberd     Updated 'is_avatax_setTaxCodeAvatax' to not run if 'Update Tax Codes' does not exist (sales records)
 * 2.61       09 Jul 2020     Doug Humberd     Updated to not update tax code if 'Tax Item' is checked on the item record (sources to the Tax Item field on the line)
 * 2.65       09 Jul 2020     Doug Humberd     Updated Germany 'variable' tax codes to use Rev Rec Start Date, not Trandate
 * 2.66       10 Jul 2020     Doug Humberd     Revert Germany tax codes to not modify for temporary VAT codes
 * 2.70       10 Jul 2020     Doug Humberd     Updated to only run on create if created from is empty
 * 2.75       28 Aug 2020     Doug Humberd     Updated Ireland Tax Codes to use different codes if Transaction Date is between 9/1/20 and 2/28/21 (different process for CM's)
 * 2.76       31 Aug 2020     Doug Humberd     Add add'l code for Ireland VAT changes to execute when 'created from' is not empty (Ireland Only)
 * 2.80       15 Dec 2020     Doug Humberd     Added additional tax codes/logic for France
 * 2.85       25 Jan 2021     Doug Humberd     Added logic to populate the 'In EU' field if ship country is Euro, but not same as Subsidiary Country
 * 2.90       23 Aug 2021     Doug Humberd     Added additional tax codes/logic for Austria
 * 2.95       01 Sep 2021     Doug Humberd     Replaced all UK codes of "ESSS_GB" with "O_GB"
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const GLOBALSOFTWARE_LLC = '10';
const INSIGHTSOFTWARE_INC = '22';
const LONGVIEW_SOL_CANADA_ULC = '95';
const EXCEL4APPS_INC = '53';
const AVATAX = '1239';

const STANDARD_RATE_AU = '23';
const EXEMPT_AU = '25';
const O_AU = '5443';
const OS_AU = '1610';

const S_DK = '3870';
const ES_DK = '3880';
const ESSS_DK = '3884';
//const ESSP_DK = '3885';
const E_DK = '3879';
//const IS_DK = '3887';
//const I_DK = '3886';
const O_DK = '3881';
const OS_DK = '3882';
const RCS_DK_SR = '5444';
const ESSP_DK_SR = '5445';
const ESGP_DK = '5446';

const S_GB = '6';
const ESSS_GB = '17';
const ESGS_GB = '934';
const ESGP_GB = '12';
const E_GB = '9';
const O_GB = '11';
const OS_GB = '933';
const RCS_GB_SR = '18';
const ESSP_GB_SR = '16';

const S_SE = '4791';
const ES_SE = '4803';
const ESSS_SE = '4807';
//const ESSP_SE = '4808';
const E_SE = '4795';
//const IS_SE = '4802';
//const I_SE = '4800';
const O_SE = '4798';
const OS_SE = '4799';
const RCS_SE_SR = '5450';
const ESSP_SE_SR = '5451';
const ESGP_SE = '5452';

const S_NO = '4813';
const ES_NO = '5127';
const ESSS_NO = '5128';
const E_NO = '4817';
const IS_NO = '4819';
const I_NO = '4818';
const O_NO = '4816';
const OS_NO = '5129';

const S_IE = '39';
const S1_IE = '6275';//CHECK VALUE IN PROD
const ESSS_IE = '45';
const ESSS1_IE = '6281';//CHECK VALUE IN PROD
const ESGS_IE = '41';
const E_IE = '48';
const O_IE = '49';
const OS_IE = '50';
const RCS_IE_SR = '931';
const ESSP_IE_SR = '54';
const ESGP_IE = '5136';

const S_NL = '1637';
const ESSS_NL = '1649';
//const ESSP_NL = '1650';
const ESGS_NL = '5690';
const E_NL = '1642';
const O_NL = '1643';
const OS_NL = '1645';
const RCS_NL_SR = '5447';
const ESSP_NL_SR = '5448';
const ESGP_NL = '5449';

const STANDARD_RATE_NZ = '56';
const EXEMPT_NZ = '58';

const SC_ZA = '1462';
const S_ZA = '1460';
const Z_ZA = '1461';

const E_CH = '5593';
const S_CH = '5589';

const E_DE = '5574';
const ESGS_DE = '5602';//NOT BEING USED
const ESSS_DE = '5580';
const ESSS1_DE = '5614';
const ESGP_DE = '5603';
const ESSP_DE_SR = '5601';
const O_DE = '5600';
const OS_DE = '5583';
const RCS_DE_SR = '5599';
const S_DE = '5569';
const S2_DE = '5610';

const BC_GST_PST = '5604';
const QC_GST_QST = '5605';

const E_FR = '6232';
const ES_FR = '6233';
const ESSP_FR = '6239';
const ESSS_FR = '6238';
const O_FR = '6235';
const S_FR = '6220';

const E_AT = '6936';
const ES_AT = '6937';
const ESSP_AT = '6944';
const ESSS_AT = '6941';
const O_AT = '6945';
const S_AT = '6930';



/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord salesorder, invoice, creditmemo
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_avatax_beforeLoad(type, form, request){
    try {
        //is_avatax_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_avatax_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord salesorder, invoice, creditmemo
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_avatax_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        is_avatax_setTaxCodeAvatax(type);
        is_avatax_updIrelandVAT(type);
    } catch (e) {
        is_avatax_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord salesorder, invoice, creditmemo
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_avatax_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        //is_avatax_afterSubmitFunction(type);
    } catch (e) {
        is_avatax_logError(e);
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
function is_avatax_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}



function is_avatax_setTaxCodeAvatax(type){
	
	//Only run on create (also run on edit, but only if the "Check OS-AU" field is checked) - Remove AU Code per Cherrie 9-25-19
	//Only run on create (also run on edit, but only if the "Update Tax Codes" field is checked)
	if (type != 'create' && type != 'edit'){
	//if (type != 'create'){
		return;
	}
	
	//Only run in Edit mode if Update Tax Codes is checked
	var updTaxCodes = nlapiGetFieldValue('custbody_scg_update_taxcodes');
	nlapiLogExecution('DEBUG', 'Update Tax Codes', updTaxCodes);
	if (type == 'edit' && (updTaxCodes == 'F' || isEmpty(updTaxCodes))){
		return;
	}
	
	//Only run in Create mode if Created From is empty
	var createdFrom = nlapiGetFieldValue('createdfrom');
	if (type == 'create' && !isEmpty(createdFrom)){
		return;
	}
	
	var dataMigration = nlapiGetFieldValue('custbody_data_migration');
	if (dataMigration == 'T'){
		return;
	}

	var transRec = nlapiGetNewRecord();
	var transType = transRec.getRecordType();
	var transId = transRec.getId();
	var customer = transRec.getFieldValue('entity');
	var subsidiary = transRec.getFieldValue('subsidiary');
	var subCountry = nlapiLookupField('subsidiary', subsidiary, 'country');
	
	
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
	nlapiLogExecution('DEBUG', 'Subsidiary Country', subCountry);
	nlapiLogExecution('DEBUG', 'Type', type);
	//nlapiLogExecution('DEBUG', 'Check OS-AU', checkOS_AU);
	
	//if (type == 'create'){
		
		//Determine if Customer/Subsidiary combo is Exempt
		var exempt = 'F';
		
		var searchExempt = isExempt(customer, subsidiary);
		
		if (searchExempt){
			nlapiLogExecution('DEBUG', 'Exempt Record Found', 'SET EXEMPT CODE');
			exempt = 'T';
		}
		
		
		
		//Check 'In EU' if ship country is Euro but different from Subsidiary Country.  Uncheck if not Euro
		if (subCountry != shipCountry){
			
			var euCountry = 'F';
			
			var iseurosearchresults = isEuropeanCountry(shipCountry);
			
			if (iseurosearchresults){
				
				for (var z = 0; z < iseurosearchresults.length; z++){
					euCountry = iseurosearchresults[z].getValue('custrecord_ec');
				}
				
			}
			
			if (euCountry == 'T'){
				nlapiSetFieldValue('custbody_in_eu', 'T');
			}else{//euCountry == 'F'
				nlapiSetFieldValue('custbody_in_eu', 'F');
			}//End if (euCountry == 'F')
			
		}//End if (subCountry != shipCountry)
		
		
		
		//Set Tax Code to AVATAX
		//if ((subsidiary == GLOBALSOFTWARE_LLC || subsidiary == INSIGHTSOFTWARE_INC || subsidiary == EXCEL4APPS_INC) && shipCountry == 'US'){
		if (subCountry == 'US' && shipCountry == 'US'){
			
			//NEW beforeSubmit CODE
			var lineCount = nlapiGetLineItemCount('item');
			
			for(var x = 1; x <= lineCount; x++){
				
				var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
				nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
				if (taxItem == 'T'){
					nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
					continue;
				}
				
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
			
		}//End if (subCountry == 'US' && shipCountry == 'US')

		
		//**********************************************************************************
		//AUSTRALIA   AUSTRALIA   AUSTRALIA   AUSTRALIA   AUSTRALIA   AUSTRALIA   AUSTRALIA
		//**********************************************************************************
		
		//Set Tax Codes if Subsidiary Country = AU (Australia)
		if (subCountry == 'AU'){
			
			if (exempt == 'T'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', EXEMPT_AU);
					nlapiSetLineItemValue('item', 'taxcode', x, EXEMPT_AU);
				}
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'AU'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', STANDARD_RATE_AU);
						nlapiSetLineItemValue('item', 'taxcode', x, STANDARD_RATE_AU);
					}
					
				}else{//shipCountry != AU
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}

						var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
						var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
						nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
						
						if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
							nlapiLogExecution('DEBUG', 'Set TaxCode Value To', OS_AU);
							nlapiSetLineItemValue('item', 'taxcode', x, OS_AU);
						}
						if (itemSubtype == 'Purchase'){
							nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_AU);
							nlapiSetLineItemValue('item', 'taxcode', x, O_AU);
						}
					}
					
				}//End if shipCountry != AU
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'AU')
		
		
		//******************************************************************************
		//DENMARK   DENMARK   DENMARK   DENMARK   DENMARK   DENMARK   DENMARK   DENMARK
		//******************************************************************************
		
		//Set Tax Codes if Subsidiary Country = DK (Denmark)
		if (subCountry == 'DK'){
			
			if (exempt == 'T'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', E_DK);
					nlapiSetLineItemValue('item', 'taxcode', x, E_DK);
				}
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'DK'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_DK);
						nlapiSetLineItemValue('item', 'taxcode', x, S_DK);
					}
					
				}else{//shipCountry != DK
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
						var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
						nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
						
						if (euCountry == 'T'){
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_DK);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSS_DK);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSP_DK_SR);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSP_DK_SR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_DK);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSS_DK);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESGP_DK);
									nlapiSetLineItemValue('item', 'taxcode', x, ESGP_DK);
								}
							}
						}else{//euCountry == 'F'
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_DK);
									nlapiSetLineItemValue('item', 'taxcode', x, O_DK);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', RCS_DK_SR);
									nlapiSetLineItemValue('item', 'taxcode', x, RCS_DK_SR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_DK);
									nlapiSetLineItemValue('item', 'taxcode', x, O_DK);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_DK);
									nlapiSetLineItemValue('item', 'taxcode', x, O_DK);
								}
							}
							
						}
						
					}
					
				}//End if shipCountry != DK
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'DK')
		
		//***********************************************************************************
		//UNITED KINGDOM   UNITED KINGDOM   UNITED KINGDOM   UNITED KINGDOM   UNITED KINGDOM
		//***********************************************************************************
		
		//Set Tax Codes if Subsidiary Country = GB (United Kingdom)
		if (subCountry == 'GB'){
			
			if (exempt == 'T'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', E_GB);
					nlapiSetLineItemValue('item', 'taxcode', x, E_GB);
				}
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'GB'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_GB);
						nlapiSetLineItemValue('item', 'taxcode', x, S_GB);
					}
					
				}else{//shipCountry != GB
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
						var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
						nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
						
						if (euCountry == 'T'){
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_GB);
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_GB);
									nlapiSetLineItemValue('item', 'taxcode', x, O_GB);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSP_GB_SR);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSP_GB_SR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_GB);
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_GB);
									nlapiSetLineItemValue('item', 'taxcode', x, O_GB);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESGP_GB);
									nlapiSetLineItemValue('item', 'taxcode', x, ESGP_GB);
								}
							}
						}else{//euCountry == 'F'
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_GB);
									nlapiSetLineItemValue('item', 'taxcode', x, O_GB);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', RCS_GB_SR);
									nlapiSetLineItemValue('item', 'taxcode', x, RCS_GB_SR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_GB);
									nlapiSetLineItemValue('item', 'taxcode', x, O_GB);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_GB);
									nlapiSetLineItemValue('item', 'taxcode', x, O_GB);
								}
							}
							
						}
						
					}
					
				}//End if shipCountry != GB
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'GB')
		
		//*******************************************************************************
		//SWEDEN   SWEDEN   SWEDEN   SWEDEN   SWEDEN   SWEDEN   SWEDEN   SWEDEN   SWEDEN
		//*******************************************************************************
		
		//Set Tax Codes if Subsidiary Country = SE (Sweden)
		if (subCountry == 'SE'){
			
			if (exempt == 'T'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', E_SE);
					nlapiSetLineItemValue('item', 'taxcode', x, E_SE);
				}
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'SE'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_SE);
						nlapiSetLineItemValue('item', 'taxcode', x, S_SE);
					}
					
				}else{//shipCountry != SE
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
						var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
						nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
						
						if (euCountry == 'T'){
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_SE);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSS_SE);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSP_SE_SR);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSP_SE_SR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_SE);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSS_SE);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESGP_SE);
									nlapiSetLineItemValue('item', 'taxcode', x, ESGP_SE);
								}
							}
						}else{//euCountry == 'F'
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_SE);
									nlapiSetLineItemValue('item', 'taxcode', x, O_SE);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', RCS_SE_SR);
									nlapiSetLineItemValue('item', 'taxcode', x, RCS_SE_SR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_SE);
									nlapiSetLineItemValue('item', 'taxcode', x, O_SE);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_SE);
									nlapiSetLineItemValue('item', 'taxcode', x, O_SE);
								}
							}
							
						}
						
					}
					
				}//End if shipCountry != SE
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'SE')

		//*******************************************************************************
		//NORWAY   NORWAY   NORWAY   NORWAY   NORWAY   NORWAY   NORWAY   NORWAY   NORWAY
		//*******************************************************************************
		
		//Set Tax Codes if Subsidiary Country = NO (Norway)
		if (subCountry == 'NO'){
			
			if (exempt == 'T'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', E_NO);
					nlapiSetLineItemValue('item', 'taxcode', x, E_NO);
				}
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'NO'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_NO);
						nlapiSetLineItemValue('item', 'taxcode', x, S_NO);
					}
					
				}else{//shipCountry != NO
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
						var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
						nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
						
						if (euCountry == 'T'){
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_NO);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSS_NO);
								}
								if (itemSubtype == 'Purchase'){
									//NO TAX CODE FOR EU SERVICE FOR PURCHASE
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_NO);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSS_NO);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ES_NO);
									nlapiSetLineItemValue('item', 'taxcode', x, ES_NO);
								}
							}
						}else{//euCountry == 'F'
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_NO);
									nlapiSetLineItemValue('item', 'taxcode', x, O_NO);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', IS_NO);
									nlapiSetLineItemValue('item', 'taxcode', x, IS_NO);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_NO);
									nlapiSetLineItemValue('item', 'taxcode', x, O_NO);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', I_NO);
									nlapiSetLineItemValue('item', 'taxcode', x, I_NO);
								}
							}
						}
						
					}
					
				}//End if shipCountry != NO
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'NO')
		
		
		//******************************************************************************
		//IRELAND   IRELAND   IRELAND   IRELAND   IRELAND   IRELAND   IRELAND   IRELAND
		//******************************************************************************
		
		//Set Tax Codes if Subsidiary Country = IE (Ireland)
		if (subCountry == 'IE'){

			//Some Tax Codes are different if transaction date is between 9/1/2020 and 2/28/2021
			//If Credit Memo, use the Transaction Date from the 'Created From' field (likely invoice)
			//Determine which tax codes to use
			//REMOVE CREDIT MEMO CODE per Cherrie.  CM with created from will take values automatically from created from record (carried over)
			
			
			//if (transType == 'creditmemo'){
				//var createdfrom = nlapiGetFieldValue('createdfrom');
				
				//if (!isEmpty(createdfrom)){
					
					//var rectypesearch = getRecType(createdfrom);
					
					//if (rectypesearch){
						//var cfRecType = rectypesearch[0].getValue('recordtype');
						//var invDate = nlapiLookupField(cfRecType, createdfrom, 'trandate');
					//}
					
				//}else{//End if (!isEmpty(createdfrom))
					//var invDate = nlapiGetFieldValue('trandate');
				//}
				
			//}else{
				var invDate = nlapiGetFieldValue('trandate');
			//}
			
			
			var invDateObj = new Date(invDate);
			var startDate = new Date('9/1/2020');
			var endDate = new Date('3/1/2021');
			nlapiLogExecution('DEBUG', 'Invoice Date', invDateObj);
			nlapiLogExecution('DEBUG', 'Start Date = ' + startDate, 'End Date = ' + endDate);
			
			if (invDateObj >= startDate && invDateObj < endDate){
				var variableTaxCode1 = S1_IE;
				var variableTaxCode2 = ESSS1_IE;
				nlapiLogExecution('DEBUG', 'Use Temporary Tax Codes', 'S1_IE and ESSS1_IE');
			}else{
				var variableTaxCode1 = S_IE;
				var variableTaxCode2 = ESSS_IE;
				nlapiLogExecution('DEBUG', 'Use Original Tax Codes', 'S_IE and ESSS_IE');
			}
			
			
			if (exempt == 'T'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', E_IE);
					nlapiSetLineItemValue('item', 'taxcode', x, E_IE);
				}
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'IE'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_IE);
						//nlapiSetLineItemValue('item', 'taxcode', x, S_IE);
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', variableTaxCode1);
						nlapiSetLineItemValue('item', 'taxcode', x, variableTaxCode1);
					}
					
				}else{//shipCountry != IE
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
						var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
						nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
						
						if (euCountry == 'T'){
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_IE);
									//nlapiSetLineItemValue('item', 'taxcode', x, ESSS_IE);
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', variableTaxCode2);
									nlapiSetLineItemValue('item', 'taxcode', x, variableTaxCode2);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSP_IE_SR);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSP_IE_SR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_IE);
									//nlapiSetLineItemValue('item', 'taxcode', x, ESSS_IE);
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', variableTaxCode2);
									nlapiSetLineItemValue('item', 'taxcode', x, variableTaxCode2);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESGP_IE);
									nlapiSetLineItemValue('item', 'taxcode', x, ESGP_IE);
								}
							}
						}else{//euCountry == 'F'
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_IE);
									nlapiSetLineItemValue('item', 'taxcode', x, O_IE);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', RCS_IE_SR);
									nlapiSetLineItemValue('item', 'taxcode', x, RCS_IE_SR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_IE);
									nlapiSetLineItemValue('item', 'taxcode', x, O_IE);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_IE);
									nlapiSetLineItemValue('item', 'taxcode', x, O_IE);
								}
							}
						}
						
					}
					
				}//End if shipCountry != IE
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'IE')
		
		
		//**********************************************************************************
		//NETHERLANDS   NETHERLANDS   NETHERLANDS   NETHERLANDS   NETHERLANDS   NETHERLANDS
		//**********************************************************************************
		
		//Set Tax Codes if Subsidiary Country = NL (Netherlands)
		if (subCountry == 'NL'){
			
			if (exempt == 'T'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', E_NL);
					nlapiSetLineItemValue('item', 'taxcode', x, E_NL);
				}
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'NL'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_NL);
						nlapiSetLineItemValue('item', 'taxcode', x, S_NL);
					}
					
				}else{//shipCountry != NL
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
						var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
						nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
						
						if (euCountry == 'T'){
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_NL);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSS_NL);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSP_NL_SR);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSP_NL_SR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_NL);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSS_NL);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESGP_NL);
									nlapiSetLineItemValue('item', 'taxcode', x, ESGP_NL);
								}
							}
						}else{//euCountry == 'F'
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_NL);
									nlapiSetLineItemValue('item', 'taxcode', x, O_NL);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', RCS_NL_SR);
									nlapiSetLineItemValue('item', 'taxcode', x, RCS_NL_SR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_NL);
									nlapiSetLineItemValue('item', 'taxcode', x, O_NL);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_NL);
									nlapiSetLineItemValue('item', 'taxcode', x, O_NL);
								}
							}
							
						}
						
					}
					
				}//End if shipCountry != NL
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'NL')
		
		
		//**********************************************************************************
		//NEW ZEALAND   NEW ZEALAND   NEW ZEALAND   NEW ZEALAND   NEW ZEALAND   NEW ZEALAND
		//**********************************************************************************
		
		//Set Tax Codes if Subsidiary Country = NZ (New Zealand)
		if (subCountry == 'NZ'){
			
			if (exempt == 'T'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', EXEMPT_NZ);
					nlapiSetLineItemValue('item', 'taxcode', x, EXEMPT_NZ);
				}
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'NZ'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', STANDARD_RATE_NZ);
						nlapiSetLineItemValue('item', 'taxcode', x, STANDARD_RATE_NZ);
					}
					
				}else{//shipCountry != NZ
					
					//NO TAX CODES FOR Non-NZ Ship Country
					
				}//End if shipCountry != NZ
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'NZ')
		
		
		//*************************************************************************
		//SOUTH AFRICA   SOUTH AFRICA   SOUTH AFRICA   SOUTH AFRICA   SOUTH AFRICA
		//*************************************************************************
		
		//Set Tax Codes if Subsidiary Country = ZA (South Africa)
		if (subCountry == 'ZA'){
			
			if (exempt == 'T'){
				
				//NO EXEMPT TAX CODE
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'ZA'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
						var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
						nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
						
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiLogExecution('DEBUG', 'Set TaxCode Value To', SC_ZA);
								nlapiSetLineItemValue('item', 'taxcode', x, SC_ZA);
							}
							if (itemSubtype == 'Purchase'){
								nlapiLogExecution('DEBUG', 'Set TaxCode Value To', SC_ZA);
								nlapiSetLineItemValue('item', 'taxcode', x, SC_ZA);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_ZA);
								nlapiSetLineItemValue('item', 'taxcode', x, S_ZA);
							}
							if (itemSubtype == 'Purchase'){
								nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_ZA);
								nlapiSetLineItemValue('item', 'taxcode', x, S_ZA);
							}
						}
						
					}
					
				}else{//shipCountry != ZA
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', Z_ZA);
						nlapiSetLineItemValue('item', 'taxcode', x, Z_ZA);
						
					}
					
				}//End if shipCountry != ZA
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'ZA')
		
		
		//**********************************************************************************
		//SWITZERLAND   SWITZERLAND   SWITZERLAND   SWITZERLAND   SWITZERLAND   SWITZERLAND
		//**********************************************************************************
		
		//Set Tax Codes if Subsidiary Country = CH (Switzerland)
		if (subCountry == 'CH'){
			
			if (exempt == 'T'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', E_CH);
					nlapiSetLineItemValue('item', 'taxcode', x, E_CH);
				}
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'CH'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_CH);
						nlapiSetLineItemValue('item', 'taxcode', x, S_CH);
					}
					
				}else{//shipCountry != CH
					
					//NO TAX CODES FOR Non-CH Ship Country
					
				}//End if shipCountry != CH
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'CH')
		
		
		//******************************************************************************
		//GERMANY   GERMANY   GERMANY   GERMANY   GERMANY   GERMANY   GERMANY   GERMANY
		//******************************************************************************
		
		//Set Tax Codes if Subsidiary Country = DE (Germany)
		if (subCountry == 'DE'){
			
			//Some Tax Codes are different if transaction date is between 7/1/2020 and 12/31/2020
			//Determine which tax codes to use
			//var invDate = nlapiGetFieldValue('trandate');//Per Cherrie, use Rev Rec Start Date going forward, not Trandate
			//var invDateObj = new Date(invDate);
			//var startDate = new Date('7/1/2020');
			//var endDate = new Date('1/1/2021');
			//nlapiLogExecution('DEBUG', 'Invoice Date', invDateObj);
			//nlapiLogExecution('DEBUG', 'Start Date = ' + startDate, 'End Date = ' + endDate);
			
			//if (invDateObj >= startDate && invDateObj < endDate){
				//var variableTaxCode1 = S2_DE;
				//var variableTaxCode2 = ESSS1_DE;
				//nlapiLogExecution('DEBUG', 'Use Temporary Tax Codes', 'S2_DE and ESSS1_DE');
			//}else{
				//var variableTaxCode1 = S_DE;
				//var variableTaxCode2 = ESSS_DE;
				//nlapiLogExecution('DEBUG', 'Use Original Tax Codes', 'S_DE and ESSS_DE');
			//}
			
			
			if (exempt == 'T'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', E_DE);
					nlapiSetLineItemValue('item', 'taxcode', x, E_DE);
				}
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'DE'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_DE);
						nlapiSetLineItemValue('item', 'taxcode', x, S_DE);
						//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', variableTaxCode1);
						//nlapiSetLineItemValue('item', 'taxcode', x, variableTaxCode1);
					}
					
				}else{//shipCountry != DE
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
						var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
						nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
						
						if (euCountry == 'T'){
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_DE);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSS_DE);
									//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', variableTaxCode2);
									//nlapiSetLineItemValue('item', 'taxcode', x, variableTaxCode2);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSP_DE_SR);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSP_DE_SR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_DE);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSS_DE);
									//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', variableTaxCode2);
									//nlapiSetLineItemValue('item', 'taxcode', x, variableTaxCode2);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESGP_DE);
									nlapiSetLineItemValue('item', 'taxcode', x, ESGP_DE);
								}
							}
						}else{//euCountry == 'F'
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_DE);
									nlapiSetLineItemValue('item', 'taxcode', x, O_DE);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', RCS_DE_SR);
									nlapiSetLineItemValue('item', 'taxcode', x, RCS_DE_SR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_DE);
									nlapiSetLineItemValue('item', 'taxcode', x, O_DE);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_DE);
									nlapiSetLineItemValue('item', 'taxcode', x, O_DE);
								}
							}
							
						}
						
					}
					
				}//End if shipCountry != DE
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'DE')
		
		
		//*******************************************************************************
		//CANADA   CANADA   CANADA   CANADA   CANADA   CANADA   CANADA   CANADA   CANADA
		//*******************************************************************************
		
		//Set Tax Codes if Subsidiary = Longview Solutions Canada ULC (Canada)
		if (subsidiary == LONGVIEW_SOL_CANADA_ULC){
			
			if (shipState == 'QC'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', QC_GST_QST);
					nlapiSetLineItemValue('item', 'taxcode', x, QC_GST_QST);
				}
				
			}
			
			if (shipState == 'BC'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', BC_GST_PST);
					nlapiSetLineItemValue('item', 'taxcode', x, BC_GST_PST);
				}
				
			}
			
		}//End if (subsidiary == LONGVIEW_SOL_CANADA_ULC)
		
		
		//*******************************************************************************
		//FRANCE   FRANCE   FRANCE   FRANCE   FRANCE   FRANCE   FRANCE   FRANCE   FRANCE
		//*******************************************************************************
		
		//Set Tax Codes if Subsidiary Country = FR (France)
		if (subCountry == 'FR'){
			
			if (exempt == 'T'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', E_FR);
					nlapiSetLineItemValue('item', 'taxcode', x, E_FR);
				}
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'FR'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_FR);
						nlapiSetLineItemValue('item', 'taxcode', x, S_FR);
					}
					
				}else{//shipCountry != SE
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
						var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
						nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
						
						if (euCountry == 'T'){
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_FR);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSS_FR);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSP_FR);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSP_FR);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ES_FR);
									nlapiSetLineItemValue('item', 'taxcode', x, ES_FR);
								}
								if (itemSubtype == 'Purchase'){
									//N/A
								}
							}
						}else{//euCountry == 'F'
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_FR);
									nlapiSetLineItemValue('item', 'taxcode', x, O_FR);
								}
								if (itemSubtype == 'Purchase'){
									//N/A
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_FR);
									nlapiSetLineItemValue('item', 'taxcode', x, O_FR);
								}
								if (itemSubtype == 'Purchase'){
									//N/A
								}
							}
							
						}
						
					}
					
				}//End if shipCountry != FR
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'FR')
		
		
		//******************************************************************************
		//AUSTRIA   AUSTRIA   AUSTRIA   AUSTRIA   AUSTRIA   AUSTRIA   AUSTRIA   AUSTRIA
		//******************************************************************************
		
		//Set Tax Codes if Subsidiary Country = AT (Austria)
		if (subCountry == 'AT'){
			
			if (exempt == 'T'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', E_AT);
					nlapiSetLineItemValue('item', 'taxcode', x, E_AT);
				}
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'AT'){
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_AT);
						nlapiSetLineItemValue('item', 'taxcode', x, S_AT);
					}
					
				}else{//shipCountry != AT
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var lineCount = nlapiGetLineItemCount('item');
					
					for (var x = 1; x <= lineCount; x++){
						
						var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
						nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
						if (taxItem == 'T'){
							nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
							continue;
						}
						
						var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
						var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
						nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
						
						if (euCountry == 'T'){
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_AT);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSS_AT);
								}
								if (itemSubtype == 'Purchase'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSP_AT);
									nlapiSetLineItemValue('item', 'taxcode', x, ESSP_AT);
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ES_AT);
									nlapiSetLineItemValue('item', 'taxcode', x, ES_AT);
								}
								if (itemSubtype == 'Purchase'){
									//N/A
								}
							}
						}else{//euCountry == 'F'
							if (itemType == 'Service'){
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_AT);
									nlapiSetLineItemValue('item', 'taxcode', x, O_AT);
								}
								if (itemSubtype == 'Purchase'){
									//N/A
								}
							}else{//Not Service
								if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
									nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_AT);
									nlapiSetLineItemValue('item', 'taxcode', x, O_AT);
								}
								if (itemSubtype == 'Purchase'){
									//N/A
								}
							}
							
						}
						
					}
					
				}//End if shipCountry != AT
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'AT')
		
		
	//}//End if (type == 'create')
	
	//REMOVE AU CODE PER CHERRIE 9-25-19
	
	/*
	
	if (type == 'create' || (type == 'edit' && checkOS_AU == 'T')){
		
		//Set Tax Code to OS-AU
		if (subCountry == 'AU' && shipCountry != 'AU'){
			
			//NEW beforeSubmit CODE
			var lineCount = nlapiGetLineItemCount('item');
			
			for(var i = 1; i <= lineCount; i++){
				
				//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', OS_AU);
				nlapiSetLineItemValue('item', 'taxcode', i, OS_AU);
				
			}
			
			nlapiSetFieldValue('custbody_scg_check_os_au', 'F');
			
		}
		
	}
	
	*/
	
	//If checked, uncheck the Update Tax Codes field
	if (updTaxCodes == 'T'){
		nlapiSetFieldValue('custbody_scg_update_taxcodes', 'F');
	}
	
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




function isExempt(customer, subsidiary){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_scg_ctce_customer', null, 'anyof', customer));
	filters.push(new nlobjSearchFilter('custrecord_scg_ctce_subsidiary', null, 'anyof', subsidiary));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('custrecord_scg_ctce_customer', null, null));
	columns.push(new nlobjSearchColumn('custrecord_scg_ctce_subsidiary', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('customrecord_scg_cust_tax_code_exempts', null, filters, columns);
	  
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




function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}   





function getRecType(createdfrom){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', createdfrom));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('recordtype', null, null));
	//columns[0].setSort(false /* ascending */);
	  
	// Get results
	var results = nlapiSearchRecord('transaction', null, filters, columns);
	  
	// Return
	return results;
	
}




/**
 * Runs the tax script for IRELAND if created from is not empty.
 * Intended to update the new VAT codes
 *
 * @appliedtorecord salesorder, invoice, creditmemo
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_avatax_updIrelandVAT(type){
	
	nlapiLogExecution('DEBUG', 'updIrelandVAT', 'START');
	
	//Only run on create (also run on edit, but only if the "Update Tax Codes" field is checked)
	if (type != 'create' && type != 'edit'){
		return;
	}
	
	//Only run in Edit mode if Update Tax Codes is checked
	var updTaxCodes = nlapiGetFieldValue('custbody_scg_update_taxcodes');
	nlapiLogExecution('DEBUG', 'Update Tax Codes', updTaxCodes);
	if (type == 'edit' && (updTaxCodes == 'F' || isEmpty(updTaxCodes))){
		return;
	}
	
	//Only run in Create mode if Created From is not empty
	var createdFrom = nlapiGetFieldValue('createdfrom');
	if (type == 'create' && isEmpty(createdFrom)){
		return;
	}
	
	var dataMigration = nlapiGetFieldValue('custbody_data_migration');
	if (dataMigration == 'T'){
		return;
	}

	var transRec = nlapiGetNewRecord();
	var transType = transRec.getRecordType();
	var transId = transRec.getId();
	var customer = transRec.getFieldValue('entity');
	var subsidiary = transRec.getFieldValue('subsidiary');
	var subCountry = nlapiLookupField('subsidiary', subsidiary, 'country');
	
	//Only run for Invoices (per Cherrie)
	if (transType != 'invoice'){
		nlapiLogExecution('DEBUG', 'Not an Invoice', 'RETURN')
		return;
	}
	
	
	//if (transType == 'purchaseorder' || transType == 'vendorbill' || transType == 'vendorcredit'){
		//var shipCountry = transRec.getFieldText('custbody_shipping_country');
		//nlapiLogExecution('DEBUG', 'shipCountry before Search = ', shipCountry);
		
		//if (!shipCountry){
			//return;
		//}
		
		//Convert Custom Shipping Country value to the 2 digit country code
		//var searchCode = getCountryCode(shipCountry);
		
		//if (searchCode){
			//shipCountry = searchCode[0].getValue('custrecord_cr_country_code');
		//}
		//nlapiLogExecution('DEBUG', 'shipCountry after Search = ', shipCountry);

	//}else{
		var shipCountry = transRec.getFieldValue('shipcountry');
		//var shipState = transRec.getFieldValue('shipstate');
		//nlapiLogExecution('DEBUG', 'ship state', shipState);
	//}
	
	nlapiLogExecution('DEBUG', 'shipCountry for recType ' + transType, shipCountry);
	
	//var shipCountry = transRec.getFieldValue('shipcountry');
	
	
	nlapiLogExecution('DEBUG', 'Trans Type = ' + transType, 'Trans ID = ' + transId);
	nlapiLogExecution('DEBUG', 'Customer', customer);
	nlapiLogExecution('DEBUG', 'Subsidiary = ' + subsidiary, 'Ship Country = ' + shipCountry);
	nlapiLogExecution('DEBUG', 'Subsidiary Country', subCountry);
	nlapiLogExecution('DEBUG', 'Type', type);
	
	//Determine if Customer/Subsidiary combo is Exempt
	//var exempt = 'F';
	
	//var searchExempt = isExempt(customer, subsidiary);
	
	//if (searchExempt){
		//nlapiLogExecution('DEBUG', 'Exempt Record Found', 'SET EXEMPT CODE');
		//exempt = 'T';
	//}
	
	
	
	//Check 'In EU' if ship country is Euro but different from Subsidiary Country.  Uncheck if not Euro
	if (subCountry != shipCountry){
		
		var euCountry = 'F';
		
		var iseurosearchresults = isEuropeanCountry(shipCountry);
		
		if (iseurosearchresults){
			
			for (var z = 0; z < iseurosearchresults.length; z++){
				euCountry = iseurosearchresults[z].getValue('custrecord_ec');
			}
			
		}
		
		if (euCountry == 'T'){
			nlapiSetFieldValue('custbody_in_eu', 'T');
		}else{//euCountry == 'F'
			nlapiSetFieldValue('custbody_in_eu', 'F');
		}//End if (euCountry == 'F')
		
	}//End if (subCountry != shipCountry)
	
	

	//******************************************************************************
	//IRELAND   IRELAND   IRELAND   IRELAND   IRELAND   IRELAND   IRELAND   IRELAND
	//******************************************************************************
	
	//Set Tax Codes if Subsidiary Country = IE (Ireland)
	if (subCountry == 'IE'){

		//Some Tax Codes are different if transaction date is between 9/1/2020 and 2/28/2021
		//If Credit Memo, use the Transaction Date from the 'Created From' field (likely invoice)
		//Determine which tax codes to use
		
		
		//if (transType == 'creditmemo'){
			//var createdfrom = nlapiGetFieldValue('createdfrom');
			
			//if (!isEmpty(createdfrom)){
				
				//var rectypesearch = getRecType(createdfrom);
				
				//if (rectypesearch){
					//var cfRecType = rectypesearch[0].getValue('recordtype');
					//var invDate = nlapiLookupField(cfRecType, createdfrom, 'trandate');
				//}
				
			//}else{//End if (!isEmpty(createdfrom))
				//var invDate = nlapiGetFieldValue('trandate');
			//}
			
		//}else{
			var invDate = nlapiGetFieldValue('trandate');
		//}
		
		
		var invDateObj = new Date(invDate);
		var startDate = new Date('9/1/2020');
		var endDate = new Date('3/1/2021');
		nlapiLogExecution('DEBUG', 'Invoice Date', invDateObj);
		nlapiLogExecution('DEBUG', 'Start Date = ' + startDate, 'End Date = ' + endDate);
		
		if (invDateObj >= startDate && invDateObj < endDate){
			var variableTaxCode1 = S1_IE;
			var variableTaxCode2 = ESSS1_IE;
			nlapiLogExecution('DEBUG', 'Use Temporary Tax Codes', 'S1_IE and ESSS1_IE');
		}else{
			var variableTaxCode1 = S_IE;
			var variableTaxCode2 = ESSS_IE;
			nlapiLogExecution('DEBUG', 'Use Original Tax Codes', 'S_IE and ESSS_IE');
		}
		
		
		//if (exempt == 'T'){
			
			//var lineCount = nlapiGetLineItemCount('item');
			
			//for (var x = 1; x <= lineCount; x++){
				
				//var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
				//nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
				//if (taxItem == 'T'){
					//nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
					//continue;
				//}
				
				//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', E_IE);
				//nlapiSetLineItemValue('item', 'taxcode', x, E_IE);
			//}
			
		//}else{//exempt == 'F'
			
			if (shipCountry == 'IE'){
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', S_IE);
					//nlapiSetLineItemValue('item', 'taxcode', x, S_IE);
					nlapiLogExecution('DEBUG', 'Set TaxCode Value To', variableTaxCode1);
					nlapiSetLineItemValue('item', 'taxcode', x, variableTaxCode1);
				}
				
			}else{//shipCountry != IE
				
				var euCountry = 'F';
				
				var searchresults = isEuropeanCountry(shipCountry);
				
				if (searchresults){
					
					for (var i = 0; i < searchresults.length; i++){
						euCountry = searchresults[i].getValue('custrecord_ec');
					}
					
				}
				
				var lineCount = nlapiGetLineItemCount('item');
				
				for (var x = 1; x <= lineCount; x++){
					
					var taxItem = nlapiGetLineItemValue('item', 'custcol_scg_tax_item', x);
					nlapiLogExecution('DEBUG', 'Tax Item Line ' + x, taxItem);
					if (taxItem == 'T'){
						nlapiLogExecution('DEBUG', 'Tax Item Checked Line ' + x, 'TAX CODE NOT UPDATED');
						continue;
					}
					
					var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
					var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
					nlapiLogExecution('DEBUG', 'itemType: ' + itemType, 'itemSubtype: ' + itemSubtype);
					
					if (euCountry == 'T'){
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_IE);
								//nlapiSetLineItemValue('item', 'taxcode', x, ESSS_IE);
								nlapiLogExecution('DEBUG', 'Set TaxCode Value To', variableTaxCode2);
								nlapiSetLineItemValue('item', 'taxcode', x, variableTaxCode2);
							}
							//if (itemSubtype == 'Purchase'){
								//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSP_IE_SR);
								//nlapiSetLineItemValue('item', 'taxcode', x, ESSP_IE_SR);
							//}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESSS_IE);
								//nlapiSetLineItemValue('item', 'taxcode', x, ESSS_IE);
								nlapiLogExecution('DEBUG', 'Set TaxCode Value To', variableTaxCode2);
								nlapiSetLineItemValue('item', 'taxcode', x, variableTaxCode2);
							}
							//if (itemSubtype == 'Purchase'){
								//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', ESGP_IE);
								//nlapiSetLineItemValue('item', 'taxcode', x, ESGP_IE);
							//}
						}
					}else{//euCountry == 'F'
						//if (itemType == 'Service'){
							//if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_IE);
								//nlapiSetLineItemValue('item', 'taxcode', x, O_IE);
							//}
							//if (itemSubtype == 'Purchase'){
								//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', RCS_IE_SR);
								//nlapiSetLineItemValue('item', 'taxcode', x, RCS_IE_SR);
							//}
						//}else{//Not Service
							//if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_IE);
								//nlapiSetLineItemValue('item', 'taxcode', x, O_IE);
							//}
							//if (itemSubtype == 'Purchase'){
								//nlapiLogExecution('DEBUG', 'Set TaxCode Value To', O_IE);
								//nlapiSetLineItemValue('item', 'taxcode', x, O_IE);
							//}
						//}
					}
					
				}
				
			}//End if shipCountry != IE
			
		//}//End if (exempt == 'F')
		
	}//End if (subCountry == 'IE')
	
}





