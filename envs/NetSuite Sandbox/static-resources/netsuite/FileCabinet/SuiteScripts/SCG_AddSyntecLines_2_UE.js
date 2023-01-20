/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     11 Feb 2021     Doug Humberd     Create/Organize lines for ViaReport if Syntec Amount has a value
 *                          Doug Humberd     Migrated Code to be Standalone so can be run on SO and Ret Auth.  (was SCG_SalesOrder_2_UE originally)
 * 1.05     18 Feb 2021     Doug Humberd     Updated to determine 'Quantity' and 'Qty for Customer' for Syntec line based on Record Type
 * 1.10     03 Mar 2021     Doug Humberd     Updated to include 'Bundle' fields when copying to new lines (original and Syntec)
 * 
 */
define(['N/record', 'N/search', 'N/runtime'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, runtime) {
	
	const SYNTEC_ITEM = '7251';//Non-Inventory Item: Syntec
   
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
    		is_asl_addSyntecLines(context);
    	}catch(e){
    		is_asl_logError(e);
    	}

    }
    
    
    
    
    
    /**
     * Creates Project Records on Sales Order Lines when SO is Approved
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type
     * @Since 2015.2
     */
    function is_asl_addSyntecLines(context){
    	
    	log.debug('addSyntecLines Context Type', context.type);
    	log.debug('Context Object', context);
    	
    	//Run on Create
    	//if (context.type != 'create' && context.type != 'edit'){
    	if (context.type != 'create'){
    		return;
    	}
    	
    	log.debug('addSyntecLines', 'START');
    	
    	var remUsage = runtime.getCurrentScript().getRemainingUsage();
    	log.debug('Remaining Governance Units', remUsage);
    	
    	var transId = context.newRecord.id;
    	log.debug('Transaction ID', transId);
    	
    	var transType = context.newRecord.type;
    	log.debug('Transaction Type', transType);
    	
    	var transRec = record.load({
    	    type: transType,
    	    id: transId,
    	    isDynamic: true,
    	});
    	
    	var linesToDelete = [];
    	
    	var itemCount = transRec.getLineCount({
		    sublistId: 'item'
		});
		log.debug('itemCount', itemCount);
		
		for (var i = 0; i < itemCount; i++){
			
			var syntecAmt = transRec.getSublistValue({
			    sublistId: 'item',
			    fieldId: 'custcol_syntec_amount',
			    line: i
			});
			log.debug('Syntec Amount', syntecAmt);
			
			//If Syntec Amount has a value, copy existing line (to be deleted later), and create 2 new lines
			
			if (syntecAmt > 0){
				
				var lineUniqueKey = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'lineuniquekey',
				    line: i
				});
				log.debug('Line Unique Key', lineUniqueKey);
				
				//Add Line Unique Key to Array of lines to be deleted later
				if (!isEmpty(lineUniqueKey)){
					linesToDelete.push(lineUniqueKey);
				}
				
				
				//Get All Line Item Values
				var item = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'item',
				    line: i
				});
				
				var qty = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'quantity',
				    line: i
				});
				
				var qtyForCust = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_quantity_for_customer',
				    line: i
				});
				
				var rate = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'rate',
				    line: i
				});
				
				var amount = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'amount',
				    line: i
				});
				
				//Calculate New Amount Value (Amount - Syntec Amount)
				//amount = Number(amount) - Number(syntecAmt);
				
				var taxCode = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'taxcode',
				    line: i
				});
				
				var discPct = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_discount_precent',
				    line: i
				});
				
				var billSched = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'billingschedule',
				    line: i
				});
				
				var erpVersion = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_erp_version',
				    line: i
				});
				
				var erp = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'class',
				    line: i
				});
				
				var businessLine = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_so_business_line',
				    line: i
				});
				
				var prodLine = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'location',
				    line: i
				});
				
				var svcType = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_service_type',
				    line: i
				});
				
				var deliveryType = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_delivery_type',
				    line: i
				});
				
				var satisfClause = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_satisfaction_clause_required',
				    line: i
				});
				
				var rrStart = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_rev_rec_start_date',
				    line: i
				});
				
				var rrEnd = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_rev_rec_end_date',
				    line: i
				});
				
				var termStart = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_term_start_date',
				    line: i
				});
				
				var termEnd = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_term_end_date',
				    line: i
				});
				
				var commRate = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_so_commrate',
				    line: i
				});
				
				var commAmt = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_comm_amt',
				    line: i
				});
				
				//var pctComp = transRec.getSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'percentcomplete',
				    //line: i
				//});
				
				var oaRate = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_scg_oa_rate',
				    line: i
				});
				
				//Calculate New OA Rate Value (OA Rate - Syntec Amount)
				//oaRate = Number(oaRate) - Number(syntecAmt);
				
				var prodFamily = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_product_family',
				    line: i
				});
				
				var createProjByScript = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_scg_create_proj_by_script',
				    line: i
				});
				
				var origNSProjId = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_scg_original_project_order_id',
				    line: i
				});
				
				var syntecIndInit = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_indice_initiale',
				    line: i
				});
				
				var syntecIndDeFact = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_indice_de_facturation',
				    line: i
				});
				
				var bundleName = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_bundle_name',
				    line: i
				});
				
				var bundleDesc = transRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_bundle_description',
				    line: i
				});
				
				
				log.debug('Item', item);
				log.debug('Quantity', qty);
				log.debug('Qty for Customer', qtyForCust);
				log.debug('Rate', rate);
				log.debug('Amount', amount);
				log.debug('Tax Code', taxCode);
				log.debug('Discount %', discPct);
				log.debug('Billing Schedule', billSched);
				log.debug('ERP Version', erpVersion);
				log.debug('ERP', erp);
				log.debug('Business Line', businessLine);
				log.debug('Product Line', prodLine);
				log.debug('Service Type', svcType);
				log.debug('Delivery Type', deliveryType);
				log.debug('Satisfaction Clause Req', satisfClause);
				log.debug('Rev Rec Start', rrStart);
				log.debug('Rev Rec End', rrEnd);
				log.debug('Term Start Date', termStart);
				log.debug('Term End Date', termEnd);
				log.debug('Commission Rate', commRate);
				log.debug('Commission Amount', commAmt);
				//log.debug('Percent Complete', pctComp);
				log.debug('OA Rate', oaRate);
				log.debug('Product Family', prodFamily);
				log.debug('Create Project by Script', createProjByScript);
				log.debug('Original NS Project Int Id', origNSProjId);
				log.debug('Syntec Indice Initiale', syntecIndInit);
				log.debug('Syntec Indice De Facturation', syntecIndDeFact);
				log.debug('Bundle Name', bundleName);
				log.debug('Bundle Description', bundleDesc);
				
				
				//Create Description Value - to be written to the 'Syntec' line
				var syntecDescription = 'Indice initiale: ' + syntecIndInit + '\r\nIndice de facturation: ' + syntecIndDeFact;
				log.debug('Syntec Description', syntecDescription);
				
				
				//*********************************************************************************
				//Add Existing Line to the Transaction
				transRec.selectNewLine({
				    sublistId: 'item'
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'item',
				    value: item,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'quantity',
				    value: qty,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_quantity_for_customer',
				    value: qtyForCust,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'rate',
				    value: rate,
				    //value: amount,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'amount',
				    value: amount,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'taxcode',
				    value: taxCode,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_discount_precent',
				    value: discPct,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'billingschedule',
				    value: billSched,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_erp_version',
				    value: erpVersion,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'class',
				    value: erp,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_so_business_line',
				    value: businessLine,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'location',
				    value: prodLine,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_service_type',
				    value: svcType,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_delivery_type',
				    value: deliveryType,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_satisfaction_clause_required',
				    value: satisfClause,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_rev_rec_start_date',
				    value: rrStart,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_rev_rec_end_date',
				    value: rrEnd,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_term_start_date',
				    value: termStart,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_term_end_date',
				    value: termEnd,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_so_commrate',
				    value: commRate,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_comm_amt',
				    value: commAmt,
				    ignoreFieldChange: false
				});
				
				//transRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'percentcomplete',
				    //value: pctComp,
				    //ignoreFieldChange: false
				//});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_scg_oa_rate',
				    value: oaRate,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_product_family',
				    value: prodFamily,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_scg_create_proj_by_script',
				    value: createProjByScript,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_scg_original_project_order_id',
				    value: origNSProjId,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_amount',
				    value: syntecAmt,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_indice_initiale',
				    value: syntecIndInit,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_indice_de_facturation',
				    value: syntecIndDeFact,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_bundle_name',
				    value: bundleName,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_bundle_description',
				    value: bundleDesc,
				    ignoreFieldChange: false
				});
				

				
				transRec.commitLine({
				    sublistId: 'item'
				});

				
				
				//*********************************************************************************
				
				
				
				//Add New Syntec Line to the Transaction
				transRec.selectNewLine({
				    sublistId: 'item'
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'item',
				    value: SYNTEC_ITEM,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'description',
				    value: syntecDescription,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'quantity',
				    value: '1',
				    ignoreFieldChange: false
				});
				
				//Set Quantity for Customer based on Record Type
				if (transType == 'salesorder'){
					
					transRec.setCurrentSublistValue({
					    sublistId: 'item',
					    fieldId: 'custcol_quantity_for_customer',
					    value: '1',
					    ignoreFieldChange: false
					});
					
				} 
					
				if (transType == 'returnauthorization'){
						
					transRec.setCurrentSublistValue({
					    sublistId: 'item',
					    fieldId: 'custcol_quantity_for_customer',
					    value: '-1',
					    ignoreFieldChange: false
					});	
						
				}
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'rate',
				    value: syntecAmt,
				    ignoreFieldChange: false
				});
				
				//transRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'amount',
				    //value: amount,
				    //ignoreFieldChange: false
				//});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'taxcode',
				    value: taxCode,
				    ignoreFieldChange: false
				});
				
				//transRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_discount_precent',
				    //value: discPct,
				    //ignoreFieldChange: false
				//});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'billingschedule',
				    value: billSched,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_erp_version',
				    value: erpVersion,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'class',
				    value: erp,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_so_business_line',
				    value: businessLine,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'location',
				    value: prodLine,
				    ignoreFieldChange: false
				});
				
				//transRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_service_type',
				    //value: svcType,
				    //ignoreFieldChange: false
				//});
				
				//transRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_delivery_type',
				    //value: deliveryType,
				    //ignoreFieldChange: false
				//});
				
				//transRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_satisfaction_clause_required',
				    //value: satisfClause,
				    //ignoreFieldChange: false
				//});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_rev_rec_start_date',
				    value: rrStart,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_rev_rec_end_date',
				    value: rrEnd,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_term_start_date',
				    value: termStart,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_term_end_date',
				    value: termEnd,
				    ignoreFieldChange: false
				});
				
				//transRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_so_commrate',
				    //value: commRate,
				    //ignoreFieldChange: false
				//});
				
				//transRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_comm_amt',
				    //value: commAmt,
				    //ignoreFieldChange: false
				//});
				
				//transRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'percentcomplete',
				    //value: pctComp,
				    //ignoreFieldChange: false
				//});
				
				//transRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_scg_oa_rate',
				    //value: oaRate,
				    //ignoreFieldChange: false
				//});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_product_family',
				    value: prodFamily,
				    ignoreFieldChange: false
				});
				
				//transRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_scg_create_proj_by_script',
				    //value: createProjByScript,
				    //ignoreFieldChange: false
				//});
				
				//transRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_scg_original_project_order_id',
				    //value: origNSProjId,
				    //ignoreFieldChange: false
				//});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_amount',
				    value: syntecAmt,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_indice_initiale',
				    value: syntecIndInit,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_indice_de_facturation',
				    value: syntecIndDeFact,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_bundle_name',
				    value: bundleName,
				    ignoreFieldChange: false
				});
				
				transRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_bundle_description',
				    value: bundleDesc,
				    ignoreFieldChange: false
				});
				

				
				transRec.commitLine({
				    sublistId: 'item'
				});
				
				
				//*********************************************************************************
				
				
				
				
				
				
				//var transRecordId = soRec.save({
				    //enableSourcing: true,
				    //ignoreMandatoryFields: true
				//});
				//log.debug('transRecordId', transRecordId);
				
				
			}//End if (syntecAmt > 0)
			
			
		
		}//End for i loop
		
		
		//Delete the Original Lines from the Transaction (that were copied / used to create the new syntec lines)
		log.debug('Delete Lines with these Unique Ids', linesToDelete);
		
		var itemCount2 = transRec.getLineCount({
		    sublistId: 'item'
		});
		log.debug('itemCount 2', itemCount2);
		
		//for (var d = itemCount2.length - 1; d >= 0; d--) {
		for (var d = itemCount2 - 1; d >= 0; d--) {
		//for (var i = 0; i < itemCount; i++){
			log.debug('Line in Loop', d);
			
			var lineUniqueKey2 = transRec.getSublistValue({
			    sublistId: 'item',
			    fieldId: 'lineuniquekey',
			    line: d
			});
			log.debug('Line Unique Key 2', lineUniqueKey2);
			
			if (linesToDelete.indexOf(lineUniqueKey2) > -1){
				
				log.debug('Unique Key Found!!', 'Deleting Line with this Unique Line ID: ' + lineUniqueKey2);
				
				transRec.removeLine({
				    sublistId: 'item',
				    line: d,
				});
				
			}//End if (linesToDelete.indexOf(lineUniqueKey2) > -1)
			
		}//End for d loop
		
		
		//Save the Transaction
		var transRecordId = transRec.save({
		    enableSourcing: true,
		    ignoreMandatoryFields: true
		});
		log.debug('transRecordId', transRecordId);
		
		
		var remUsage = runtime.getCurrentScript().getRemainingUsage();
    	log.debug('Remaining Governance Units', remUsage);
    	
    	
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
 * @appliedtorecord creditmemo, customerpayment, journalentry
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_asl_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}



