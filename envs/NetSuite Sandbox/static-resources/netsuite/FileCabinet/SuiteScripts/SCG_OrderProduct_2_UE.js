/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     27 Dec 2021     Doug Humberd     Handles User Events on Order Product Records
 *                          Doug Humberd     Checks 'Update Revenue Element' if certain fields modified
 * 1.01     06 Jan 2022     Doug Humberd     Remove Rev Rec Dates, End User, and Rate references
 * 1.02     12 Jan 2022     Doug Humberd     Remove Currency, Subsidiary, Product Line references, Add ERP
 * 1.05     13 Jan 2022     Doug Humberd     Added 'is_op_createRevEventTrigger'
 * 1.10     12 Apr 2022     Doug Humberd     Updated 'is_op_updRevElmt' to include an Exchange Rate check
 *  
 * 
 */
define(['N/record', 'N/search', 'N/format'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, format) {
	
	const THIRD_PARTY_CREATION = '1';//Custom Recognition Event Type: Third Party Source Rev Rec Event Type - Revenue Arrangement Creation
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {string} context.type - Trigger type
     * @param {Form} context.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(context) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(context) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(context) {
    	
    	try{
    		is_op_updRevElmt(context);
    		is_op_createRevEventTrigger(context);
    	}catch(e){
    		is_op_logError(e);
    	}

    }
    
    
    
    
    
    function is_op_updRevElmt(context){
    	
    	//Run on Edit
    	//if (context.type != 'create' && context.type != 'edit'){
    	if (context.type != 'edit'){
    		return;
    	}
    	
    	log.debug('updRevElmt', 'START');
    	log.debug('Execution Type', context.type);
    	
    	var opRec = context.newRecord;
    	var opId = opRec.id;
    	log.debug('Order Product ID', opId);
    	
    	var oldOpRec = context.oldRecord;
    	
    	
    	//Get New Record Values
    	var qty = opRec.getValue({
			fieldId: 'custrecord_is_cl_quantity'
		});
    	
    	//var price = opRec.getValue({
			//fieldId: 'custrecord_is_cl_price'
		//});
    	
    	var totPrice = opRec.getValue({
			fieldId: 'custrecord_is_cl_totalprice'
		});
    	
    	var item = opRec.getValue({
			fieldId: 'custrecord_is_cl_item'
		});
    	
    	//var currency = opRec.getValue({
			//fieldId: 'custrecord_is_cl_currency'
		//});
    	
    	//var subsidiary = opRec.getValue({
			//fieldId: 'custrecord_is_cl_subsidiary'
		//});
    	
    	var dept = opRec.getValue({
			fieldId: 'custrecord_op_department'
		});
    	
    	//var prodLine = opRec.getValue({
			//fieldId: 'custrecord_op_product_line'
		//});
    	
    	var loc = opRec.getValue({
			fieldId: 'custrecord_is_cl_location'
		});
    	
    	//var rrStart = opRec.getValue({
			//fieldId: 'custrecord_is_revrec_startdate'
		//});
    	
    	//var rrEnd = opRec.getValue({
			//fieldId: 'custrecord_is_revrec_enddate'
		//});
    	
    	var erp = opRec.getValue({
			fieldId: 'custrecord_op_erp'
		});
    	
    	var exchrate = opRec.getValue({
			fieldId: 'custrecord_is_cl_exchangerate'
		});
    	

    	
    	
    	//Get Old Record Values
    	var oldQty = oldOpRec.getValue({
			fieldId: 'custrecord_is_cl_quantity'
		});
    	
    	//var oldPrice = oldOpRec.getValue({
			//fieldId: 'custrecord_is_cl_price'
		//});
    	
    	var oldTotPrice = oldOpRec.getValue({
			fieldId: 'custrecord_is_cl_totalprice'
		});
    	
    	var oldItem = oldOpRec.getValue({
			fieldId: 'custrecord_is_cl_item'
		});
    	
    	//var oldCurrency = oldOpRec.getValue({
			//fieldId: 'custrecord_is_cl_currency'
		//});
    	
    	//var oldSubsidiary = oldOpRec.getValue({
			//fieldId: 'custrecord_is_cl_subsidiary'
		//});
    	
    	var oldDept = oldOpRec.getValue({
			fieldId: 'custrecord_op_department'
		});
    	
    	//var oldProdLine = oldOpRec.getValue({
			//fieldId: 'custrecord_op_product_line'
		//});
    	
    	var oldLoc = oldOpRec.getValue({
			fieldId: 'custrecord_is_cl_location'
		});
    	
    	//var oldRRStart = oldOpRec.getValue({
			//fieldId: 'custrecord_is_revrec_startdate'
		//});
    	
    	//var oldRREnd = oldOpRec.getValue({
			//fieldId: 'custrecord_is_revrec_enddate'
		//});
    	
    	var oldERP = oldOpRec.getValue({
			fieldId: 'custrecord_op_erp'
		});
    	
    	var oldExchrate = oldOpRec.getValue({
			fieldId: 'custrecord_is_cl_exchangerate'
		});
    	
    	
    	log.debug('Old Quantity: ' + oldQty, 'Quantity: ' + qty);
    	//log.debug('Old Price: ' + oldPrice, 'Price: ' + price);
    	log.debug('Old Total Price: ' + oldTotPrice, 'Total Price: ' + totPrice);
    	log.debug('Old Item: ' + oldItem, 'Item: ' + item);
    	//log.debug('Old Currency: ' + oldCurrency, 'Currency: ' + currency);
    	//log.debug('Old Subsidiary: ' + oldSubsidiary, 'Subsidiary: ' + subsidiary);
    	log.debug('Old Department: ' + oldDept, 'Department: ' + dept);
    	//log.debug('Old Product Line: ' + oldProdLine, 'Product Line: ' + prodLine);
    	log.debug('Old Location: ' + oldLoc, 'Location: ' + loc);
    	//log.debug('Old Rev Rec Start Date: ' + oldRRStart, 'Rev Rec Start Date: ' + rrStart);
    	//log.debug('Old Rev Rec End Date: ' + oldRREnd, 'Rev Rec End Date: ' + rrEnd);
    	log.debug('Old ERP: ' + oldERP, 'ERP: ' + erp);
    	log.debug('Old Exch Rate: ' + oldExchrate, 'Exch Rate: ' + exchrate);
    	
    	
    	//var rrStartDate = format.format({value: rrStart, type: format.Type.DATE});
    	//var rrEndDate = format.format({value: rrEnd, type: format.Type.DATE});
    	//var oldRRStartDate = format.format({value: oldRRStart, type: format.Type.DATE});
    	//var oldRREndDate = format.format({value: oldRREnd, type: format.Type.DATE});
    	
    	//log.debug('Old Rev Rec Start Date: ' + oldRRStartDate, 'Rev Rec Start Date: ' + rrStartDate);
    	//log.debug('Old Rev Rec End Date: ' + oldRREndDate, 'Rev Rec End Date: ' + rrEndDate);
    	
    	
    	//If any values have been changed, check 'Update Revenue Element'
    	//custrecord_is_update_rev_element
    	//if (qty != oldQty || price != oldPrice || totPrice != oldTotPrice || item != oldItem || currency != oldCurrency || subsidiary != oldSubsidiary || dept != oldDept || prodLine != oldProdLine || loc != oldLoc || rrStart != oldRRStart || rrEnd != oldRREnd){
    	//if (qty != oldQty || price != oldPrice || totPrice != oldTotPrice || item != oldItem || currency != oldCurrency || subsidiary != oldSubsidiary || dept != oldDept || prodLine != oldProdLine || loc != oldLoc || rrStartDate != oldRRStartDate || rrEndDate != oldRREndDate){
    	//if (qty != oldQty || totPrice != oldTotPrice || item != oldItem || currency != oldCurrency || subsidiary != oldSubsidiary || dept != oldDept || prodLine != oldProdLine || loc != oldLoc){
    	if (qty != oldQty || totPrice != oldTotPrice || item != oldItem || dept != oldDept || loc != oldLoc || erp != oldERP || exchrate != oldExchrate){
    		
    		log.debug('One or More Values changed', 'Check off Update Revenue Element');
    		
    		var ordProdId = record.submitFields({
    		    type: 'customrecord_contractlines',
    		    id: opId,
    		    values: {
    		        'custrecord_is_update_rev_element': true
    		    }
    		});
    		
    	}else{
    		log.debug('No Changes', 'EXIT');
    	}
    	
    	
    	
    }
    
    
    
    
    
    
    function is_op_createRevEventTrigger(context){
    	
    	//Run on Create
    	//if (context.type != 'create' && context.type != 'edit'){
    	if (context.type != 'create'){
    		return;
    	}
    	
    	log.debug('createRevEventTrigger', 'START');
    	log.debug('Execution Type', context.type);
    	
    	var opRec = context.newRecord;
    	var opId = opRec.id;
    	log.debug('Order Product ID', opId);
    	
    	
    	//Get New Record Values
    	var revElmt = opRec.getValue({
			fieldId: 'custrecord_is_cl_revenue_element'
		});
    	
    	var item = opRec.getValue({
			fieldId: 'custrecord_is_cl_item'
		});
    	
    	
    	log.debug('Revenue Element', revElmt);
    	log.debug('Item', item);

    	
    	var createRevPlansOn = search.lookupFields({
            type: search.Type.ITEM,
            id: item,
            columns: ['createrevenueplanson',
            ]
        });
        log.debug('createRevPlansOn', createRevPlansOn);
    	
    	//If any values have been changed, check 'Update Revenue Element'
        if (createRevPlansOn.createrevenueplanson[0].value == THIRD_PARTY_CREATION && isEmpty(revElmt)){
    		
    		log.debug('Criteria Met', 'Check off Create Revenue Element (Trigger Plan)');
    		
    		var ordProdId = record.submitFields({
    		    type: 'customrecord_contractlines',
    		    id: opId,
    		    values: {
    		        'custrecord_is_cl_create_forecast_plan': true
    		    }
    		});
    		
    	}else{
    		log.debug('Criteria NOT Met', 'EXIT');
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
    

    return {
        //beforeLoad: beforeLoad,
        //beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});





/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord customer
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_op_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}



