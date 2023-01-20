/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       02 Nov 2018     Doug Humberd     Sets the Tax Code Value to "Avatax" for Invoices, Sales Orders and Credit Memos when Item is Entered if
 *                                             Subsidiary = Global Software LLC or InsightSoftware, Inc and If Ship Country = US 
 * 1.10       02 Dec 2018     Doug Humberd     Updated to set Tax Code Value to "OS-AU" if Subsidiary Country = Australia and Ship Country is NOT Australia
 * 1.20       17 Dec 2018     Doug Humberd     Updated to test for subsidiary "Excel4apps Inc." (AVATAX)
 * 1.30       21 Jan 2019     Doug Humberd     Updated OS-AU code to also execute if Ship Address is modified
 * 1.31       22 Jan 2019     Doug Humberd     Updated OS-AU code to use the "Check OS-AU" checkbox to trigger the SCG_SetTaxCodeAvatax_UE script to update the OS-AU field in edit mode
 * 1.40       09 Aug 2019     Doug Humberd     Update Avatax code to no longer check for specific subsidiaries, but rather update if Subsidiary Country = US and if Ship Country = US
 * 1.50       30 Aug 2019     Doug Humberd     Added code to check for Denmark Subsidiary, and to add appropriate tax codes as necessary
 * 1.60       25 Sep 2019     Doug Humberd     Added code to check for UK Subsidiary, and to add appropriate tax codes as necessary
 *                                             Remove AU Code per Cherrie - going to use NetSuite to assign the Tax Codes
 * 1.70       21 Jan 2020     Doug Humberd     Added code to check for Sweden and Norway Subsidiaries, and to add appropriate tax codes as necessary
 * 1.75       28 Jan 2020     Doug Humberd     Added additional tax codes/logic for Sweden and Norway
 * 1.80       29 Jan 2020     Doug Humberd     Added additional tax codes/logic for Australia, Denmark, Ireland, Netherlands, New Zealand, South Africa, United Kingdom
 * 1.85       13 Mar 2020     Doug Humberd     Updated to not run if 'Data Migration' is checked
 * 
 * 1.95       01 Apr 2020     Doug Humberd     Added functionality to check Update Tax Codes if custom 'Shipping Country' value is modified (tax codes will be updated in UE script)
 * 2.00       23 Apr 2020     Doug Humberd     Added additional tax codes/logic for Switzerland and Germany
 * 2.01       30 Apr 2020     Doug Humberd     Updated - all "OS_" codes (except AU) replaced with "O_" versions
 * 2.05       20 May 2020     Doug Humberd     Added additional tax codes/logic for Canada
 * 2.10       12 Jun 2020     Doug Humberd     Updated all Eur Country Sales/Resales to use "ESSS" version of tax code
 * 2.15       26 Jun 2020     Doug Humberd     Updated Germany Tax Codes to use different codes if Transaction Date is between 7/1 and 12/31/20
 * 2.20       09 Jul 2020     Doug Humberd     Updated Germany 'variable' tax codes to use Rev Rec Start Date, not Trandate
 * 2.21       10 Jul 2020     Doug Humberd     Revert Germany tax codes to not modify for temporary VAT codes
 * 2.25       28 Aug 2020     Doug Humberd     Updated Ireland Tax Codes to use different codes if Transaction Date is between 9/1/20 and 2/28/21 (different process for CM's)
 * 2.30       31 Aug 2020     Doug Humberd     Updated 'is_avatax_recalcTaxCodesIfShipCntryChanged' to check 'Update Tax Codes' if transaction date is modified (only for Ireland, and only if tax code would have been S_IE or ESSS_IE
 * 2.35       15 Dec 2020     Doug Humberd     Added additional tax codes/logic for France
 * 2.40       25 Jan 2021     Doug Humberd     Added logic to populate the 'In EU' field if ship country is Euro, but not same as Subsidiary Country
 * 2.45       23 Aug 2021     Doug Humberd     Added additional tax codes/logic for Austria
 * 2.50       01 Sep 2021     Doug Humberd     Replaced all UK codes of "ESSS_GB" with "O_GB"
 *                                             
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
 * Performs actions when a field is changed in the user's browser
 *
 * @appliedtorecord journalentry
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function is_avatax_fieldChanged (type, name, linenum) {
	try {
		is_avatax_recalcTaxCodesIfShipCntryChanged(type, name, linenum);
		//is_avatax_fieldChangedFunction(type, name, linenum);
	} catch (e) {
		is_avatax_logError(e);
		throw e;
	}
}





/**
 * Handles client events after dependent fields are updated upon a field changed event
 *
 * @appliedtorecord salesorder, invoice, creditmemo
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function is_avatax_postSourcing(type, name) {
    try {
    	is_avatax_setTaxCodeAvatax(type, name);
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



function is_avatax_setTaxCodeAvatax(type, name){
	
	if (name == 'item'){
		
		var subsidiary = nlapiGetFieldValue('subsidiary');
		
		if (!subsidiary){
			return;
		}
		
		var dataMigration = nlapiGetFieldValue('custbody_data_migration');
		
		if (dataMigration == 'T'){
			return;
		}
		
		var subCountry = nlapiLookupField('subsidiary', subsidiary, 'country');
		
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
		
		
		var customer = nlapiGetFieldValue('entity');
		//alert ('Customer = ' + customer + '\n\nSubsidiary = ' + subsidiary + '\n\nShipCountry = ' + shipCountry + '\n\nSubsidiary Country = ' + subCountry);
		
		//Determine if Customer/Subsidiary combo is Exempt
		var exempt = 'F';
		
		var searchExempt = isExempt(customer, subsidiary);
		
		if (searchExempt){
			//alert ('Exempt Record Found');
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
			
			var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
			var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
			
			if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
				nlapiSetCurrentLineItemValue('item', 'taxcode', AVATAX);
			}
			
			//alert ('Got a Hit!!  Set TaxCode to ' + AVATAX);
			//nlapiSetCurrentLineItemValue('item', 'taxcode', AVATAX);
			
		}

		
		//**********************************************************************************
		//AUSTRALIA   AUSTRALIA   AUSTRALIA   AUSTRALIA   AUSTRALIA   AUSTRALIA   AUSTRALIA
		//**********************************************************************************
		
		//Set Tax Codes if Subsidiary Country = AU (Australia)
		if (subCountry == 'AU'){
			
			if (exempt == 'T'){
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', EXEMPT_AU);
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'AU'){
					
					nlapiSetCurrentLineItemValue('item', 'taxcode', STANDARD_RATE_AU);
					
				}else{//shipCountry != AU
					
					var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
					var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
					
					if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
						nlapiSetCurrentLineItemValue('item', 'taxcode', OS_AU);
					}
					if (itemSubtype == 'Purchase'){
						nlapiSetCurrentLineItemValue('item', 'taxcode', O_AU);
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
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', E_DK);
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'DK'){
					
					nlapiSetCurrentLineItemValue('item', 'taxcode', S_DK);
					
				}else{//shipCountry != DK
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
					var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
						
					if (euCountry == 'T'){
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_DK);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSP_DK_SR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_DK);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESGP_DK);
							}
						}
					}else{//euCountry == 'F'
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_DK);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', RCS_DK_SR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_DK);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_DK);
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
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', E_GB);
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'GB'){
					
					nlapiSetCurrentLineItemValue('item', 'taxcode', S_GB);
					
				}else{//shipCountry != GB
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
					var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
						
					if (euCountry == 'T'){
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								//nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_GB);
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_GB);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSP_GB_SR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								//nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_GB);
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_GB);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESGP_GB);
							}
						}
					}else{//euCountry == 'F'
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_GB);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', RCS_GB_SR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_GB);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_GB);
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
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', E_SE);
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'SE'){
					
					nlapiSetCurrentLineItemValue('item', 'taxcode', S_SE);
					
				}else{//shipCountry != SE
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
					var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
						
					if (euCountry == 'T'){
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_SE);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSP_SE_SR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_SE);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESGP_SE);
							}
						}
					}else{//euCountry == 'F'
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_SE);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', RCS_SE_SR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_SE);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_SE);
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
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', E_NO);
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'NO'){
					
					nlapiSetCurrentLineItemValue('item', 'taxcode', S_NO);
					
				}else{//shipCountry != NO
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
					var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
						
					if (euCountry == 'T'){
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_NO);
							}
							if (itemSubtype == 'Purchase'){
								//NO TAX CODE FOR EU SERVICE FOR PURCHASE
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_NO);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ES_NO);
							}
						}
					}else{//euCountry == 'F'
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_NO);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', IS_NO);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_NO);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', I_NO);
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
			if (recType == 'creditmemo'){
				var createdfrom = nlapiGetFieldValue('createdfrom');
				
				if (!isEmpty(createdfrom)){
					
					var rectypesearch = getRecType(createdfrom);
					
					if (rectypesearch){
						var cfRecType = rectypesearch[0].getValue('recordtype');
						var invDate = nlapiLookupField(cfRecType, createdfrom, 'trandate');
					}
					
				}else{//End if (!isEmpty(createdfrom))
					var invDate = nlapiGetFieldValue('trandate');
				}
				
			}else{
				var invDate = nlapiGetFieldValue('trandate');
			}
			
			var invDateObj = new Date(invDate);
			var startDate = new Date('9/1/2020');
			var endDate = new Date('3/1/2021');
			//alert('Invoice Date = ' + invDateObj + '\n\nStart Date = ' + startDate + '\n\nEnd Date = ' + endDate);
			
			if (invDateObj >= startDate && invDateObj < endDate){
				var variableTaxCode1 = S1_IE;
				var variableTaxCode2 = ESSS1_IE;
				//alert ('Use Temporary Tax Codes S1_IE and ESSS1_IE');
			}else{
				var variableTaxCode1 = S_IE;
				var variableTaxCode2 = ESSS_IE;
				//alert ('Use Original Tax Codes S_IE and ESSS_IE');
			}
			//END TEMPORARY VAT CODE
			
			
			
			if (exempt == 'T'){
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', E_IE);
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'IE'){
					
					//nlapiSetCurrentLineItemValue('item', 'taxcode', S_IE);
					nlapiSetCurrentLineItemValue('item', 'taxcode', variableTaxCode1);
					
				}else{//shipCountry != IE
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
					var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
						
					if (euCountry == 'T'){
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								//nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_IE);
								nlapiSetCurrentLineItemValue('item', 'taxcode', variableTaxCode2);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSP_IE_SR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								//nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_IE);
								nlapiSetCurrentLineItemValue('item', 'taxcode', variableTaxCode2);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESGP_IE);
							}
						}
					}else{//euCountry == 'F'
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_IE);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', RCS_IE_SR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_IE);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_IE);
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
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', E_NL);
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'NL'){
					
					nlapiSetCurrentLineItemValue('item', 'taxcode', S_NL);
					
				}else{//shipCountry != NL
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
					var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
						
					if (euCountry == 'T'){
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_NL);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSP_NL_SR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_NL);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESGP_NL);
							}
						}
					}else{//euCountry == 'F'
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_NL);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', RCS_NL_SR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_NL);
							}
							if (itemSubtype == 'Purchase'){
								//NO TAX CODE FOR Non-EU GOODS FOR PURCHASE
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
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', EXEMPT_NZ);
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'NZ'){
					
					nlapiSetCurrentLineItemValue('item', 'taxcode', STANDARD_RATE_NZ);
					
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
					
					var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
					var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
					
					if (itemType == 'Service'){
						if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
							nlapiSetCurrentLineItemValue('item', 'taxcode', SC_ZA);
						}
						if (itemSubtype == 'Purchase'){
							nlapiSetCurrentLineItemValue('item', 'taxcode', SC_ZA);
						}
					}else{//Not Service
						if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
							nlapiSetCurrentLineItemValue('item', 'taxcode', S_ZA);
						}
						if (itemSubtype == 'Purchase'){
							nlapiSetCurrentLineItemValue('item', 'taxcode', S_ZA);
						}
					}

				}else{//shipCountry != ZA
					
						nlapiSetCurrentLineItemValue('item', 'taxcode', Z_ZA);
					
				}//End if shipCountry != ZA
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'ZA')
		
		
		//**********************************************************************************
		//SWITZERLAND   SWITZERLAND   SWITZERLAND   SWITZERLAND   SWITZERLAND   SWITZERLAND
		//**********************************************************************************
		
		//Set Tax Codes if Subsidiary Country = CH (Switzerland)
		if (subCountry == 'CH'){
			
			if (exempt == 'T'){
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', E_CH);
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'CH'){
					
					nlapiSetCurrentLineItemValue('item', 'taxcode', S_CH);
					
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
			//alert('Invoice Date = ' + invDateObj + '\n\nStart Date = ' + startDate + '\n\nEnd Date = ' + endDate);
			
			//if (invDateObj >= startDate && invDateObj < endDate){
				//var variableTaxCode1 = S2_DE;
				//var variableTaxCode2 = ESSS1_DE;
				//alert ('Use Temporary Tax Codes S2_DE and ESSS1_DE');
			//}else{
				//var variableTaxCode1 = S_DE;
				//var variableTaxCode2 = ESSS_DE;
				//alert ('Use Original Tax Codes S_DE and ESSS_DE');
			//}
			
			
			if (exempt == 'T'){
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', E_DE);
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'DE'){
					
					nlapiSetCurrentLineItemValue('item', 'taxcode', S_DE);
					//nlapiSetCurrentLineItemValue('item', 'taxcode', variableTaxCode1);
					
				}else{//shipCountry != DE
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
					var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
						
					if (euCountry == 'T'){
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_DE);
								//nlapiSetCurrentLineItemValue('item', 'taxcode', variableTaxCode2);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSP_DE_SR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_DE);
								//nlapiSetCurrentLineItemValue('item', 'taxcode', variableTaxCode2);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESGP_DE);
							}
						}
					}else{//euCountry == 'F'
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_DE);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', RCS_DE_SR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_DE);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_DE);
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
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', QC_GST_QST);
				
			}
			
			if (shipState == 'BC'){
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', BC_GST_PST);
				
			}
			
		}//End if (subsidiary == LONGVIEW_SOL_CANADA_ULC)
		
		
		//*******************************************************************************
		//FRANCE   FRANCE   FRANCE   FRANCE   FRANCE   FRANCE   FRANCE   FRANCE   FRANCE
		//*******************************************************************************
		
		//Set Tax Codes if Subsidiary Country = FR (France)
		if (subCountry == 'FR'){
			
			if (exempt == 'T'){
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', E_FR);
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'FR'){
					
					nlapiSetCurrentLineItemValue('item', 'taxcode', S_FR);
					
				}else{//shipCountry != FR
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
					var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
						
					if (euCountry == 'T'){
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_FR);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSP_FR);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ES_FR);
							}
							if (itemSubtype == 'Purchase'){
								//N/A
							}
						}
					}else{//euCountry == 'F'
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_FR);
							}
							if (itemSubtype == 'Purchase'){
								//N/A
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_FR);
							}
							if (itemSubtype == 'Purchase'){
								//N/A
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
				
				nlapiSetCurrentLineItemValue('item', 'taxcode', E_AT);
				
			}else{//exempt == 'F'
				
				if (shipCountry == 'AT'){
					
					nlapiSetCurrentLineItemValue('item', 'taxcode', S_AT);
					
				}else{//shipCountry != AT
					
					var euCountry = 'F';
					
					var searchresults = isEuropeanCountry(shipCountry);
					
					if (searchresults){
						
						for (var i = 0; i < searchresults.length; i++){
							euCountry = searchresults[i].getValue('custrecord_ec');
						}
						
					}
					
					var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
					var itemSubtype = nlapiGetCurrentLineItemValue('item', 'itemsubtype');
						
					if (euCountry == 'T'){
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_AT);
							}
							if (itemSubtype == 'Purchase'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ESSP_AT);
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', ES_AT);
							}
							if (itemSubtype == 'Purchase'){
								//N/A
							}
						}
					}else{//euCountry == 'F'
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_AT);
							}
							if (itemSubtype == 'Purchase'){
								//N/A
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								nlapiSetCurrentLineItemValue('item', 'taxcode', O_AT);
							}
							if (itemSubtype == 'Purchase'){
								//N/A
							}
						}
					}
					
				}//End if shipCountry != AT
				
			}//End if (exempt == 'F')
			
		}//End if (subCountry == 'AT')
		
		
	}//End if (name == 'item')
	
	//REMOVE AU CODE PER CHERRIE 9-25-19
	
	/*
	
	if (name == 'shipaddress'){
		
		nlapiSetFieldValue('custbody_scg_check_os_au', 'T');
		
		nlapiLogExecution('DEBUG', 'OS-AU Script Running', 'Check OS-AU CHECKED');
		
	}
	
	*/
	
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




function is_avatax_recalcTaxCodesIfShipCntryChanged(type, name, linenum){
	
	if (name == 'custbody_shipping_country'){
		//alert ('Custom Shipping Country modified');
		
		var transId = nlapiGetRecordId();
		//alert ('transId (custbody_shipping_country) = ' + transId);
		
		if (isEmpty(transId)){
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
		
		if (oldCountry != newCountry){
			
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
	

	
	if (name == 'trandate'){
		
		//alert ('Transaction Date Changed');
		
		var transId = nlapiGetRecordId();
		//alert ('transId (trandate) = ' + transId);
		
		if (isEmpty(transId)){
			return;
		}
		
		var dataMigration = nlapiGetFieldValue('custbody_data_migration');
		
		if (dataMigration == 'T'){
			return;
		}
		
		
		
		var subsidiary = nlapiGetFieldValue('subsidiary');
		
		if (!subsidiary){
			return;
		}
		
		var subCountry = nlapiLookupField('subsidiary', subsidiary, 'country');
		
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
			//var shipState = nlapiGetFieldValue('shipstate');
			//alert ('shipState = ' + shipState);
		}
		
		//alert ('shipCountry for recType ' + recType + ' is ' + shipCountry);
		
		
		
		//******************************************************************************
		//IRELAND   IRELAND   IRELAND   IRELAND   IRELAND   IRELAND   IRELAND   IRELAND
		//******************************************************************************
		
		//Set Tax Codes if Subsidiary Country = IE (Ireland)
		if (subCountry == 'IE'){
				
			if (shipCountry == 'IE'){
					
				//nlapiSetCurrentLineItemValue('item', 'taxcode', S_IE);
				//nlapiSetCurrentLineItemValue('item', 'taxcode', variableTaxCode1);
				//alert ('Check Update Tax Codes');
				nlapiSetFieldValue('custbody_scg_update_taxcodes', 'T');
					
			}else{//shipCountry != IE
					
				var euCountry = 'F';
				
				var searchresults = isEuropeanCountry(shipCountry);
				
				if (searchresults){
					
					for (var i = 0; i < searchresults.length; i++){
						euCountry = searchresults[i].getValue('custrecord_ec');
					}
					
				}
					
				var itemCount = nlapiGetLineItemCount('item');
				
				for(var x = 1; x <= itemCount; x++){
					
					var itemType = nlapiGetLineItemValue('item', 'itemtype', x);
					var itemSubtype = nlapiGetLineItemValue('item', 'itemsubtype', x);
					
					if (euCountry == 'T'){
						if (itemType == 'Service'){
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								//nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_IE);
								//nlapiSetCurrentLineItemValue('item', 'taxcode', variableTaxCode2);
								//alert ('Check Update Tax Codes');
								nlapiSetFieldValue('custbody_scg_update_taxcodes', 'T');
								break;
							}
						}else{//Not Service
							if (itemSubtype == 'Sale' || itemSubtype == 'Resale'){
								//nlapiSetCurrentLineItemValue('item', 'taxcode', ESSS_IE);
								//nlapiSetCurrentLineItemValue('item', 'taxcode', variableTaxCode2);
								//alert ('Check Update Tax Codes');
								nlapiSetFieldValue('custbody_scg_update_taxcodes', 'T');
								break;
							}
						}
					}//End if (euCountry == 'T')
					
				}//End for x loop
				
			}//End if shipCountry != IE
				
		}//End if (subCountry == 'IE')
		

		//var click = confirm('You have modified the Transaction Date, which could mean that an alternate tax code would apply to each line item.\n\nWould you like to update all tax codes?\n(NOTE: Tax Codes will update after the record is saved).\n');
		//var click = true;
		
		//if (click == true){
			//nlapiSetFieldValue('custbody_scg_update_taxcodes', 'T');
		//}else{
			//nlapiSetFieldValue('custbody_scg_update_taxcodes', 'F');
		//}
		
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