/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     22 Dec 2020     Doug Humberd     Handles User Events on Sales Order Records
 *                          Doug Humberd     Create/Organize lines for ViaReport if Syntec Amount has a value
 * 1.05     07 Jan 2021     Doug Humberd     Updated 'is_so_addSyntecLines' to set the Description value on a Syntec Item, when added
 * 1.10     22 Jan 2021     Doug Humberd     Updated 'is_so_addSyntecLines' to no longer subtract syntec amount from original 'amount' on the line
 * 1.15     02 Feb 2021     Doug Humberd     Updated 'is_so_addSyntecLines' to copy Tax Code when creating new lines
 * 1.20     11 Feb 2021     Doug Humberd     Moved Add Syntec Lines logic to a standalone script (SCG_AddSyntecLines_2_UE) to run on both SO and Ret Auth
 * CURRENTLY UNDEPLOYED UNTIL NEW CODE ADDED TO THIS SCRIPT
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
    		//is_so_addSyntecLines(context);//MOVED TO STANDALONE SCRIPT (SCG_AddSyntecLines_2_UE)
    	}catch(e){
    		is_so_logError(e);
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
    function is_so_addSyntecLines(context){
    	
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
    	
    	//var soRec = context.newRecord;
    	var soId = context.newRecord.id;
    	log.debug('SO ID', soId);
    	
    	var soRec = record.load({
    	    type: record.Type.SALES_ORDER,
    	    id: soId,
    	    isDynamic: true,
    	});
    	
    	var linesToDelete = [];
    	
    	var itemCount = soRec.getLineCount({
		    sublistId: 'item'
		});
		log.debug('itemCount', itemCount);
		
		for (var i = 0; i < itemCount; i++){
			
			var syntecAmt = soRec.getSublistValue({
			    sublistId: 'item',
			    fieldId: 'custcol_syntec_amount',
			    line: i
			});
			log.debug('Syntec Amount', syntecAmt);
			
			//If Syntec Amount has a value, copy existing line (to be deleted later), and create 2 new lines
			
			if (syntecAmt > 0){
				
				var lineUniqueKey = soRec.getSublistValue({
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
				var item = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'item',
				    line: i
				});
				
				var qty = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'quantity',
				    line: i
				});
				
				var qtyForCust = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_quantity_for_customer',
				    line: i
				});
				
				var rate = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'rate',
				    line: i
				});
				
				var amount = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'amount',
				    line: i
				});
				
				//Calculate New Amount Value (Amount - Syntec Amount)
				//amount = Number(amount) - Number(syntecAmt);
				
				var taxCode = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'taxcode',
				    line: i
				});
				
				var discPct = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_discount_precent',
				    line: i
				});
				
				var billSched = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'billingschedule',
				    line: i
				});
				
				var erpVersion = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_erp_version',
				    line: i
				});
				
				var erp = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'class',
				    line: i
				});
				
				var businessLine = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_so_business_line',
				    line: i
				});
				
				var prodLine = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'location',
				    line: i
				});
				
				var svcType = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_service_type',
				    line: i
				});
				
				var deliveryType = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_delivery_type',
				    line: i
				});
				
				var satisfClause = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_satisfaction_clause_required',
				    line: i
				});
				
				var rrStart = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_rev_rec_start_date',
				    line: i
				});
				
				var rrEnd = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_rev_rec_end_date',
				    line: i
				});
				
				var termStart = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_term_start_date',
				    line: i
				});
				
				var termEnd = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_term_end_date',
				    line: i
				});
				
				var commRate = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_so_commrate',
				    line: i
				});
				
				var commAmt = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_comm_amt',
				    line: i
				});
				
				//var pctComp = soRec.getSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'percentcomplete',
				    //line: i
				//});
				
				var oaRate = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_scg_oa_rate',
				    line: i
				});
				
				//Calculate New OA Rate Value (OA Rate - Syntec Amount)
				//oaRate = Number(oaRate) - Number(syntecAmt);
				
				var prodFamily = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_product_family',
				    line: i
				});
				
				var createProjByScript = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_scg_create_proj_by_script',
				    line: i
				});
				
				var origNSProjId = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_scg_original_project_order_id',
				    line: i
				});
				
				var syntecIndInit = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_indice_initiale',
				    line: i
				});
				
				var syntecIndDeFact = soRec.getSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_indice_de_facturation',
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
				
				
				//Create Description Value - to be written to the 'Syntec' line
				var syntecDescription = 'Indice initiale: ' + syntecIndInit + '\r\nIndice de facturation: ' + syntecIndDeFact;
				log.debug('Syntec Description', syntecDescription);
				
				
				//*********************************************************************************
				//Add Existing Line to the Sales Order
				soRec.selectNewLine({
				    sublistId: 'item'
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'item',
				    value: item,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'quantity',
				    value: qty,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_quantity_for_customer',
				    value: qtyForCust,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'rate',
				    value: rate,
				    //value: amount,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'amount',
				    value: amount,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'taxcode',
				    value: taxCode,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_discount_precent',
				    value: discPct,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'billingschedule',
				    value: billSched,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_erp_version',
				    value: erpVersion,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'class',
				    value: erp,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_so_business_line',
				    value: businessLine,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'location',
				    value: prodLine,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_service_type',
				    value: svcType,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_delivery_type',
				    value: deliveryType,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_satisfaction_clause_required',
				    value: satisfClause,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_rev_rec_start_date',
				    value: rrStart,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_rev_rec_end_date',
				    value: rrEnd,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_term_start_date',
				    value: termStart,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_term_end_date',
				    value: termEnd,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_so_commrate',
				    value: commRate,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_comm_amt',
				    value: commAmt,
				    ignoreFieldChange: false
				});
				
				//soRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'percentcomplete',
				    //value: pctComp,
				    //ignoreFieldChange: false
				//});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_scg_oa_rate',
				    value: oaRate,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_product_family',
				    value: prodFamily,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_scg_create_proj_by_script',
				    value: createProjByScript,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_scg_original_project_order_id',
				    value: origNSProjId,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_amount',
				    value: syntecAmt,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_indice_initiale',
				    value: syntecIndInit,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_indice_de_facturation',
				    value: syntecIndDeFact,
				    ignoreFieldChange: false
				});
				

				
				soRec.commitLine({
				    sublistId: 'item'
				});

				
				
				//*********************************************************************************
				
				
				
				//Add New Syntec Line to Sales Order
				soRec.selectNewLine({
				    sublistId: 'item'
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'item',
				    value: SYNTEC_ITEM,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'description',
				    value: syntecDescription,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'quantity',
				    value: '1',
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_quantity_for_customer',
				    value: '1',
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'rate',
				    value: syntecAmt,
				    ignoreFieldChange: false
				});
				
				//soRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'amount',
				    //value: amount,
				    //ignoreFieldChange: false
				//});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'taxcode',
				    value: taxCode,
				    ignoreFieldChange: false
				});
				
				//soRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_discount_precent',
				    //value: discPct,
				    //ignoreFieldChange: false
				//});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'billingschedule',
				    value: billSched,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_erp_version',
				    value: erpVersion,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'class',
				    value: erp,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_so_business_line',
				    value: businessLine,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'location',
				    value: prodLine,
				    ignoreFieldChange: false
				});
				
				//soRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_service_type',
				    //value: svcType,
				    //ignoreFieldChange: false
				//});
				
				//soRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_delivery_type',
				    //value: deliveryType,
				    //ignoreFieldChange: false
				//});
				
				//soRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_satisfaction_clause_required',
				    //value: satisfClause,
				    //ignoreFieldChange: false
				//});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_rev_rec_start_date',
				    value: rrStart,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_rev_rec_end_date',
				    value: rrEnd,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_term_start_date',
				    value: termStart,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_term_end_date',
				    value: termEnd,
				    ignoreFieldChange: false
				});
				
				//soRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_so_commrate',
				    //value: commRate,
				    //ignoreFieldChange: false
				//});
				
				//soRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_comm_amt',
				    //value: commAmt,
				    //ignoreFieldChange: false
				//});
				
				//soRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'percentcomplete',
				    //value: pctComp,
				    //ignoreFieldChange: false
				//});
				
				//soRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_scg_oa_rate',
				    //value: oaRate,
				    //ignoreFieldChange: false
				//});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_product_family',
				    value: prodFamily,
				    ignoreFieldChange: false
				});
				
				//soRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_scg_create_proj_by_script',
				    //value: createProjByScript,
				    //ignoreFieldChange: false
				//});
				
				//soRec.setCurrentSublistValue({
				    //sublistId: 'item',
				    //fieldId: 'custcol_scg_original_project_order_id',
				    //value: origNSProjId,
				    //ignoreFieldChange: false
				//});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_amount',
				    value: syntecAmt,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_indice_initiale',
				    value: syntecIndInit,
				    ignoreFieldChange: false
				});
				
				soRec.setCurrentSublistValue({
				    sublistId: 'item',
				    fieldId: 'custcol_syntec_indice_de_facturation',
				    value: syntecIndDeFact,
				    ignoreFieldChange: false
				});
				

				
				soRec.commitLine({
				    sublistId: 'item'
				});
				
				
				//*********************************************************************************
				
				
				
				
				
				
				//var soRecordId = soRec.save({
				    //enableSourcing: true,
				    //ignoreMandatoryFields: true
				//});
				//log.debug('soRecordId', soRecordId);
				
				
			}//End if (syntecAmt > 0)
			
			
		
		}//End for i loop
		
		
		//Delete the Original Lines from the Sales Order (that were copied / used to create the new syntec lines)
		log.debug('Delete Lines with these Unique Ids', linesToDelete);
		
		var itemCount2 = soRec.getLineCount({
		    sublistId: 'item'
		});
		log.debug('itemCount 2', itemCount2);
		
		//for (var d = itemCount2.length - 1; d >= 0; d--) {
		for (var d = itemCount2 - 1; d >= 0; d--) {
		//for (var i = 0; i < itemCount; i++){
			log.debug('Line in Loop', d);
			
			var lineUniqueKey2 = soRec.getSublistValue({
			    sublistId: 'item',
			    fieldId: 'lineuniquekey',
			    line: d
			});
			log.debug('Line Unique Key 2', lineUniqueKey2);
			
			if (linesToDelete.indexOf(lineUniqueKey2) > -1){
				
				log.debug('Unique Key Found!!', 'Deleting Line with this Unique Line ID: ' + lineUniqueKey2);
				
				soRec.removeLine({
				    sublistId: 'item',
				    line: d,
				});
				
			}//End if (linesToDelete.indexOf(lineUniqueKey2) > -1)
			
		}//End for d loop
		
		
		//Save the Sales Order
		var soRecordId = soRec.save({
		    enableSourcing: true,
		    ignoreMandatoryFields: true
		});
		log.debug('soRecordId', soRecordId);
		
		
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
function is_so_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}



