/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       11 Dec 2018     Doug Humberd     Handles user events on Revenue Arrangement records
 * 	                                           Updates the End User and Partner/JV/Reseller fields from the associated transaction record
 * 1.10       10 Jun 2019     Doug Humberd     Updated to include Distributor
 * 1.15       29 Dec 2021     Doug Humberd     Added logic to flip Create Revenue Plans On values
 * 1.16       06 Jan 2022     Doug Humberd     Updated flip logic to also run in edit mode, and to flip Rev Rec Forcast Rule for Project Progress flips
 * 1.20       20 Jan 2022     Doug Humberd     Added 'is_ra_updateFieldsOrderProduct' to update End User and Forecast Dates from Order Products (only if Source Type = THIRD_PARTY)
 *                            Doug Humberd     Updated 'is_ra_updateEndUserPartnerFields' to skip lines if Source Type != TRANSACTION_LINE
 * 1.21       23 Mar 2022     Doug Humberd     Updated Flip Script to include "Old" Create Revenue Plans On Values
 * 1.25       22 Jun 2022     Doug Humberd     Updated Flip Script to always flip "Billing" scenarios when Source Type = TRANSACTION_LINE
 * 1.30       12 Dec 2022     Doug Humberd     Updated 'is_ra_updateFieldsOrderProduct' with new fields values
 *
 */


/***********************************
 * Constants
 *
 ***********************************/
const THIRD_PARTY_REV_ARRGMT_CREATION = '1';//Custom Recognition Event Type: Third Party Source Rev Rec Event Type - Revenue Arrangement Creation
const THIRD_PARTY_BILLING = '5';//Custom Recognition Event Type: Third Party Source Rev Rec Event Type - Billing
const THIRD_PARTY_PROJ_PROGRESS = '4';//Custom Recognition Event Type: Third Party Source Rev Rec Event Type - Project Progress
const THIRD_PARTY_BILLING_OLD = '3';//Custom Recognition Event Type: Third Party Source Rev Rec Event Type - Billing (old)
const THIRD_PARTY_PROJ_PROGRESS_OLD = '2';//Custom Recognition Event Type: Third Party Source Rev Rec Event Type - Project Progress (old)
const REV_ARRGMT_CREATION = '-1';//Create Revenue Plans On: Revenue Arrangement Creation
const BILLING = '-2';//Create Revenue Plans On: Billing
const PROJ_PROGRESS = '-4';//Create Revenue Plans On: Project Progress
const ISW_PER_START_END_DATE = '16';//Revenue Recognition Rule: ISW Per Start & End Date


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord revenuearrangement
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function is_ra_beforeLoad(type, form, request){
    try {
    	//is_ra_beforeLoadFunction(type, form, request);
    } catch (e) {
        is_ra_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately prior to a write event on a record.
 *
 * @appliedtorecord revenuearrangement
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_ra_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
        //is_ra_beforeSubmitFunction(type);
    } catch (e) {
        is_ra_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord revenuearrangement
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_ra_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        is_ra_updateEndUserPartnerFields(type);
        is_ra_flipCreateRevPlansOn(type);
        is_ra_updateFieldsOrderProduct(type);
    } catch (e) {
        is_ra_logError(e);
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
function is_ra_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}





/**
 * Updates the End User and Partner/JV/Reseller fields from the associated transaction record
 * Updates the Distributor field from the associated transaction record
 *
 * @appliedtorecord revenuearrangement
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function is_ra_updateEndUserPartnerFields(type){
	
	//Only run on create
	if (type != 'create'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'updateEndUserPartnerFields', 'START');
	
	var raId = nlapiGetRecordId();
	nlapiLogExecution('DEBUG', 'Rev Argmt Id', raId);
	
	var recId = '';
	var recType = '';
	
	var elementCount = nlapiGetLineItemCount('revenueelement');
	//nlapiLogExecution('DEBUG', 'Element Count', elementCount);
	
	for (var i=1; elementCount != 0 && i <= elementCount; i++){
		
		var sourceType = nlapiGetLineItemValue('revenueelement', 'custcol_rev_source_type', i);
		nlapiLogExecution('DEBUG', 'Source Type Line ' + i, sourceType);
		
		//Only process if Source Type = TRANSACTION_LINE
		if (sourceType != 'TRANSACTION_LINE'){
			continue;
		}
		
		
		var source = nlapiGetLineItemValue('revenueelement', 'source', i);
		nlapiLogExecution('DEBUG', 'Source Line ' + i, source);
		
		var revElement = nlapiGetLineItemValue('revenueelement', 'revenueelement', i);
		nlapiLogExecution('DEBUG', 'Revenue Element ' + i, revElement);
		
		//Get source information off of Revenue Element record
		var searchresults = getSourceInfo(revElement);
		
		for (var x = 0; searchresults && x < searchresults.length; x++){
			
			var srcId = searchresults[x].getValue('internalid', 'sourceTransaction');
			var srcType = searchresults[x].getValue('recordtype', 'sourceTransaction');
			
			//nlapiLogExecution('DEBUG', 'Source ID', srcId);
			//nlapiLogExecution('DEBUG', 'Source Type', srcType);
			
			if (srcId != recId && srcType != recType){
				recId = srcId;
				recType = srcType;
			}
			
		}
		
	}
	
	nlapiLogExecution('DEBUG', 'Record Type = ' + recType, 'Record Id = ' + recId);
	
	//Get End User and Partner/JV/Reseller data from source record
	if (recType != '' && recId != ''){
		
		var srcEnduser = nlapiLookupField(recType, recId, 'custbody_so_enduser');
		var srcPartner = nlapiLookupField(recType, recId, 'custbody_partnerjvreseller');
		var srcDistributor = nlapiLookupField(recType, recId, 'custbody_distributor');
		nlapiLogExecution('DEBUG', 'srcEnduser = ' + srcEnduser, 'srcPartner = ' + srcPartner);
		nlapiLogExecution('DEBUG', srcDistributor, srcDistributor);
		
		nlapiSubmitField('revenuearrangement', raId, ['custbody_so_enduser', 'custbody_partnerjvreseller', 'custbody_distributor'], [srcEnduser, srcPartner, srcDistributor]);
		
	}
	
}



function getSourceInfo(revElement){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', revElement));
	  
	// Define columns
	var columns = new Array();
	//columns.push(new nlobjSearchColumn('revenuearrangement', null, null));
	columns.push(new nlobjSearchColumn('internalid', 'sourceTransaction', null));
	columns.push(new nlobjSearchColumn('recordtype', 'sourceTransaction', null));
	  
	// Get results
	var results = nlapiSearchRecord('revenueelement', null, filters, columns);
	  
	// Return
	return results;
	
}





function is_ra_flipCreateRevPlansOn(type){
	
	//Run on create and edit
	if (type != 'create' && type != 'edit'){
	//if (type != 'create'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'flipCreateRevPlansOn', 'START');
	
	var raId = nlapiGetRecordId();
	nlapiLogExecution('DEBUG', 'Rev Argmt Id', raId);
	
	var raRec = nlapiLoadRecord('revenuearrangement', raId, {recordmode: 'dynamic'});
	
	//var recId = '';
	//var recType = '';
	var srcType = '';
	
	//var elementCount = nlapiGetLineItemCount('revenueelement');
	var elementCount = raRec.getLineItemCount('revenueelement');
	//nlapiLogExecution('DEBUG', 'Element Count', elementCount);
	
	for (var i=1; elementCount != 0 && i <= elementCount; i++){
		
		var flipRevRecRule = false;
		
		//var source = nlapiGetLineItemValue('revenueelement', 'source', i);
		var source = raRec.getLineItemValue('revenueelement', 'source', i);
		nlapiLogExecution('DEBUG', 'Source Line ' + i, source);
		
		//var revElement = nlapiGetLineItemValue('revenueelement', 'revenueelement', i);
		var revElement = raRec.getLineItemValue('revenueelement', 'revenueelement', i);
		//nlapiLogExecution('DEBUG', 'Revenue Element ' + i, revElement);
		
		var sourceType = raRec.getLineItemValue('revenueelement', 'custcol_rev_source_type', i);
		nlapiLogExecution('DEBUG', 'Source Type Line ' + i, sourceType);
		
		
		//Get source information off of Revenue Element record
		//var searchresults = getSourceInfo(revElement);
		
		//if (!searchresults){
			//continue;
		//}else{
			
			//var srcType = searchresults[0].getValue('recordtype', 'sourceTransaction');
			//nlapiLogExecution('DEBUG', 'Record Type Line ' + i, srcType);
			
		//}
		
		
		//if (source.indexOf('Invoice') != -1){
			//srcType = 'invoice';
		//}
		
		//if (source.indexOf('Credit Memo') != -1){
			//srcType = 'creditmemo';
		//}
		
		//if (source.indexOf('#') == -1){
			//srcType = 'customrecord_contractlines';//THIS IS ASSUMED TO BE ORDER PRODUCT.  RUNNING A SEARCH FOR EVERY LINE MIGHT CAUSE GOVERNANCE ISSUES
		//}
		
		
		//nlapiLogExecution('DEBUG', 'Source Type Line ' + i, srcType);
		
		
		//if (srcType == 'invoice' || srcType == 'creditmemo'){
		if (sourceType == 'TRANSACTION_LINE'){
			
			var flipTo;
			
			var armSrcExtId = raRec.getLineItemValue('revenueelement', 'custcol_arm_sourceexternalid', i);
            nlapiLogExecution('DEBUG', 'ARM Source External ID Line ' + i, armSrcExtId);
            
            if (isEmpty(armSrcExtId)){
            	
            	var createRevPlansOn = raRec.getLineItemValue('revenueelement', 'createrevenueplanson', i);
                nlapiLogExecution('DEBUG', 'Create Revenue Plans On - Line ' + i, createRevPlansOn);
                
                //if (createRevPlansOn == THIRD_PARTY_REV_ARRGMT_CREATION || createRevPlansOn == THIRD_PARTY_BILLING || createRevPlansOn == THIRD_PARTY_PROJ_PROGRESS){
                if (createRevPlansOn == THIRD_PARTY_REV_ARRGMT_CREATION || createRevPlansOn == THIRD_PARTY_BILLING || createRevPlansOn == THIRD_PARTY_PROJ_PROGRESS || createRevPlansOn == THIRD_PARTY_BILLING_OLD || createRevPlansOn == THIRD_PARTY_PROJ_PROGRESS_OLD){
                	
                	switch(createRevPlansOn){
                	
                	case THIRD_PARTY_REV_ARRGMT_CREATION:
                		flipTo = REV_ARRGMT_CREATION;
                		break;
                	case THIRD_PARTY_BILLING:
                		flipTo = BILLING;
                		break;
                	case THIRD_PARTY_BILLING_OLD:
                		flipTo = BILLING;
                		break;
                	case THIRD_PARTY_PROJ_PROGRESS:
                		flipTo = PROJ_PROGRESS;
                		flipRevRecRule = true;
                		break;
                	case THIRD_PARTY_PROJ_PROGRESS_OLD:
                		flipTo = PROJ_PROGRESS;
                		flipRevRecRule = true;
                		break;
                	
                	}//END Switch
                	
                	nlapiLogExecution('DEBUG', 'Flip Value to', flipTo);
                	nlapiLogExecution('DEBUG', 'Flip Rev Rec Rule', flipRevRecRule);
                	
                	
                	raRec.setLineItemValue('revenueelement', 'createrevenueplanson', i, flipTo);
                	
                	if (flipRevRecRule == true){
                		raRec.setLineItemValue('revenueelement', 'revrecforecastrule', i, ISW_PER_START_END_DATE);
                	}
                	
                	
                }//End if (createRevPlansOn == THIRD_PARTY_REV_ARRGMT_CREATION || createRevPlansOn == THIRD_PARTY_BILLING || createRevPlansOn == THIRD_PARTY_PROJ_PROGRESS)
            	
            }else{//if (!isEmpty(armSrcExtId))
            	
            	var createRevPlansOn = raRec.getLineItemValue('revenueelement', 'createrevenueplanson', i);
                nlapiLogExecution('DEBUG', 'Create Revenue Plans On - Line ' + i, createRevPlansOn);
                
                if (createRevPlansOn == THIRD_PARTY_BILLING || createRevPlansOn == THIRD_PARTY_BILLING_OLD){
                	
                	switch(createRevPlansOn){
                	
                	case THIRD_PARTY_BILLING:
                		flipTo = BILLING;
                		break;
                	case THIRD_PARTY_BILLING_OLD:
                		flipTo = BILLING;
                		break;
                	
                	}//END Switch
                	
                	nlapiLogExecution('DEBUG', 'Flip Value to', flipTo);
                	
                	
                	raRec.setLineItemValue('revenueelement', 'createrevenueplanson', i, flipTo);
                	
                	
                }//End if (createRevPlansOn == THIRD_PARTY_BILLING || createRevPlansOn == THIRD_PARTY_BILLING_OLD)
            	
            }

			
		}//End if (srcType == 'invoice' || srcType == 'creditmemo')
		
		
		//if (srcType == 'customrecord_contractlines'){
		if (sourceType == 'THIRD_PARTY'){
			
			var createRevPlansOn = raRec.getLineItemValue('revenueelement', 'createrevenueplanson', i);
            nlapiLogExecution('DEBUG', 'Create Revenue Plans On - Line ' + i, createRevPlansOn);
            
            //if (createRevPlansOn == THIRD_PARTY_BILLING){
            if (createRevPlansOn == THIRD_PARTY_BILLING || createRevPlansOn == THIRD_PARTY_BILLING_OLD){
            	
            	flipTo = BILLING;
            	
            	nlapiLogExecution('DEBUG', 'Flip Value to', flipTo);
            	
            	
            	raRec.setLineItemValue('revenueelement', 'createrevenueplanson', i, flipTo);
            	
            	
            }//End if (createRevPlansOn == THIRD_PARTY_BILLING)
			
		}//End 	if (srcType == 'customrecord_contractlines')
		
		
		/*
		
		for (var x = 0; searchresults && x < searchresults.length; x++){
			
			var srcId = searchresults[x].getValue('internalid', 'sourceTransaction');
			var srcType = searchresults[x].getValue('recordtype', 'sourceTransaction');
			
			//nlapiLogExecution('DEBUG', 'Source ID', srcId);
			//nlapiLogExecution('DEBUG', 'Source Type', srcType);
			
			if (srcId != recId && srcType != recType){
				recId = srcId;
				recType = srcType;
			}
			
		}
		
		*/
		
	}//End for i loop
	
	//nlapiLogExecution('DEBUG', 'Record Type = ' + recType, 'Record Id = ' + recId);
	
	nlapiSubmitRecord(raRec);
	
}






function is_ra_updateFieldsOrderProduct(type){
	
	//Only run on create
	//if (type != 'create' && type != 'edit'){//TEMP LINE FOR TESTING
	if (type != 'create'){
		return;
	}
	
	nlapiLogExecution('DEBUG', 'updateFieldsOrderProduct', 'START');
	
	var context = nlapiGetContext();
	nlapiLogExecution('DEBUG', 'Governance', 'Remaining Usage = ' + context.getRemainingUsage());
	
	var raId = nlapiGetRecordId();
	nlapiLogExecution('DEBUG', 'Rev Argmt Id', raId);
	
	var recId = '';
	var recType = '';
	
	var raRec = nlapiLoadRecord('revenuearrangement', raId, {recordmode: 'dynamic'});
	
	//var elementCount = nlapiGetLineItemCount('revenueelement');
	var elementCount = raRec.getLineItemCount('revenueelement');
	//nlapiLogExecution('DEBUG', 'Element Count', elementCount);
	
	for (var i=1; elementCount != 0 && i <= elementCount; i++){
		
		//var source = nlapiGetLineItemValue('revenueelement', 'source', i);
		var source = raRec.getLineItemValue('revenueelement', 'source', i);
		nlapiLogExecution('DEBUG', 'Source Line ' + i, source);
		
		//var revElement = nlapiGetLineItemValue('revenueelement', 'revenueelement', i);
		//nlapiLogExecution('DEBUG', 'Revenue Element ' + i, revElement);
		
		//var srcId = nlapiGetLineItemValue('revenueelement', 'sourceid', i);
		var srcId = raRec.getLineItemValue('revenueelement', 'sourceid', i);
		nlapiLogExecution('DEBUG', 'Source (Order Product) ID Line ' + i, srcId);
		
		var sourceType = raRec.getLineItemValue('revenueelement', 'custcol_rev_source_type', i);
		nlapiLogExecution('DEBUG', 'Source Type Line ' + i, sourceType);
		
		//Only process if Source Type = THIRD_PARTY
		if (sourceType != 'THIRD_PARTY'){
			continue;
		}
		
		//Get source information off of Revenue Element record
		//var searchresults = getSourceInfo(revElement);
		
		//for (var x = 0; searchresults && x < searchresults.length; x++){
			
			//var srcId = searchresults[x].getValue('internalid', 'sourceTransaction');
			//var srcType = searchresults[x].getValue('recordtype', 'sourceTransaction');
			
			//nlapiLogExecution('DEBUG', 'Source ID', srcId);
			//nlapiLogExecution('DEBUG', 'Source Type', srcType);
			
			//if (srcId != recId && srcType != recType){
				//recId = srcId;
				//recType = srcType;
			//}
			
		//}
		
		
		recId = srcId;
		recType = 'customrecord_contractlines';
		
		nlapiLogExecution('DEBUG', 'Record Type = ' + recType, 'Record Id = ' + recId);
		
		var srcEnduser = '';
		var srcSFdealID = '';
		var baseSSP = '';
		var tierMult = '';
		var tierMultDesc = '';
		var discTierMult = '';
		var discTierDesc = '';
		var blockMult = '';
		var blockTierDesc = '';
		var partDiscPct = '';
		var jvSellRate = '';
		var prorationFactor = '';

		//Get End User from source record
		if (recType != '' && recId != ''){
			
			srcEnduser = nlapiLookupField(recType, recId, 'custrecord_op_end_user', true);
			nlapiLogExecution('DEBUG', 'srcEnduser', srcEnduser);

			var sourceFields = nlapiLookupField(recType, recId, ['custrecord_is_cl_sf_deal_id', 'custrecord_is_cl_base_ssp', 'custrecord_is_cl_tier_multiplier', 'custrecord_is_cl_tier_multiplier_desc', 'custrecord_is_cl_disc_tier_mult', 'custrecord_is_cl_discount_tier_desc', 'custrecord_is_cl_block_mult', 'custrecord_is_cl_block_tier_desc', 'custrecord_op_partner_disc_percent', 'custrecord_op_jv_resellrate', 'custrecord_is_cl_proration_factor']);

			//srcSFdealID = nlapiLookupField(recType, recId, 'custrecord_is_cl_sf_deal_id');
			srcSFdealID = sourceFields.custrecord_is_cl_sf_deal_id;
			nlapiLogExecution('DEBUG', 'srcSFdealID', srcSFdealID);

			baseSSP = sourceFields.custrecord_is_cl_base_ssp;
			nlapiLogExecution('DEBUG', 'Base SSP', baseSSP);

			tierMult = sourceFields.custrecord_is_cl_tier_multiplier;
			nlapiLogExecution('DEBUG', 'Tier Multiplier', tierMult);

			tierMultDesc = sourceFields.custrecord_is_cl_tier_multiplier_desc;
			nlapiLogExecution('DEBUG', 'Tier Multiplier Description', tierMultDesc);

			discTierMult = sourceFields.custrecord_is_cl_disc_tier_mult;
			nlapiLogExecution('DEBUG', 'Discount Tier Multiplier', discTierMult);

			discTierDesc = sourceFields.custrecord_is_cl_discount_tier_desc;
			nlapiLogExecution('DEBUG', 'Discount Tier Description', discTierDesc);

			blockMult = sourceFields.custrecord_is_cl_block_mult;
			nlapiLogExecution('DEBUG', 'Block Multiplier', blockMult);

			blockTierDesc = sourceFields.custrecord_is_cl_block_tier_desc;
			nlapiLogExecution('DEBUG', 'Block Tier Description', blockTierDesc);

			partDiscPct = sourceFields.custrecord_op_partner_disc_percent;
			nlapiLogExecution('DEBUG', 'Partner Discount Percent', partDiscPct);

			jvSellRate = sourceFields.custrecord_op_jv_resellrate;
			nlapiLogExecution('DEBUG', '3rd Party Commission', jvSellRate);

			prorationFactor = sourceFields.custrecord_is_cl_proration_factor;
			nlapiLogExecution('DEBUG', 'Proration Factor', prorationFactor);
			
			//nlapiSubmitField('revenuearrangement', raId, ['custbody_so_enduser', 'custbody_partnerjvreseller', 'custbody_distributor'], [srcEnduser, srcPartner, srcDistributor]);
			
		}
		
		//Get Start / End Date Values
		var rrStartDate = raRec.getLineItemValue('revenueelement', 'revrecstartdate', i);
		nlapiLogExecution('DEBUG', 'RR Start Date Line ' + i, rrStartDate);
		
		var rrEndDate = raRec.getLineItemValue('revenueelement', 'revrecenddate', i);
		nlapiLogExecution('DEBUG', 'RR End Date Line ' + i, rrEndDate);
		
		
		//Update Values on Revenue Arrangement Lines
		raRec.setLineItemValue('revenueelement', 'forecaststartdate', i, rrStartDate);
		raRec.setLineItemValue('revenueelement', 'forecastenddate', i, rrEndDate);
		raRec.setLineItemValue('revenueelement', 'custcol_end_user_customer_line', i, srcEnduser);
		raRec.setLineItemValue('revenueelement', 'custcol_sf_deal_id_ra', i, srcSFdealID);

		raRec.setLineItemValue('revenueelement', 'custcol_isw_base_ssp_ra', i, baseSSP);
		raRec.setLineItemValue('revenueelement', 'custcol_isw_tier_multiplier_ra', i, tierMult);
		raRec.setLineItemValue('revenueelement', 'custcol_isw_tier_multi_desc_ra', i, tierMultDesc);
		raRec.setLineItemValue('revenueelement', 'custcol_isw_discount_tier_multi_ra', i, discTierMult);
		raRec.setLineItemValue('revenueelement', 'custcol_isw_discount_tier_desc_ra', i, discTierDesc);
		raRec.setLineItemValue('revenueelement', 'custcol_isw_block_price_multiplier_ra', i, blockMult);
		raRec.setLineItemValue('revenueelement', 'custcol_isw_block_tier_desc_ra', i, blockTierDesc);
		raRec.setLineItemValue('revenueelement', 'custcol_isw_partner_discount_ra', i, partDiscPct);
		raRec.setLineItemValue('revenueelement', 'custcol_isw_thirdparty_commission_ra', i, jvSellRate);
		raRec.setLineItemValue('revenueelement', 'custcol_isw_proration_factor_ra', i, prorationFactor);
		
		nlapiLogExecution('DEBUG', 'Governance', 'Remaining Usage = ' + context.getRemainingUsage());

		
	}//End for i loop
	
	
	//Save the Revenue Arrangement Record
	nlapiSubmitRecord(raRec);
	
	nlapiLogExecution('DEBUG', 'Governance', 'Remaining Usage = ' + context.getRemainingUsage());
	nlapiLogExecution('DEBUG', 'updateFieldsOrderProduct', 'END');
	
}







function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}




