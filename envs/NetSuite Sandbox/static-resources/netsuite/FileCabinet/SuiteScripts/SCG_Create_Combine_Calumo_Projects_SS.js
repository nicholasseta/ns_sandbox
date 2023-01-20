/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 Nov 2021     Doug Humberd     Scheduled Script to create / consolidate projects on Order Product records when Business Line = Calumo
 *                            Doug Humberd     Projects combined if same 'Order' and 'Item' combination
 *
 */


/**
 * Constants
 */
const CALUMO = '14';//Business Line: Calumo


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord recordType
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function is_calumoProjs_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
	}
}


/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function is_calumoProjs_createCombineCalumoProjs(type){
	
	nlapiLogExecution('DEBUG', 'createCombineCalumoProjs', 'START');
	
	var orderProductId;
	//var lastId;
	var minRecId = 0;
	var projAction;
	
	var ordProdIds = is_calop_getCalumoOrdProdIds(minRecId);
	var count = 0;
	
	if (!ordProdIds){
		nlapiLogExecution('DEBUG', 'No Order Product Records Found for Processing', 'EXIT');
		return;
	}
	
	while (ordProdIds && ordProdIds.length > 0){
		
		// Loop through the results and update them
		is_calumoProjs_scheduledBatch(ordProdIds, function (ordProdId) {
			try{
				
				orderProductId = ordProdId.getValue('internalid');
				nlapiLogExecution('DEBUG', 'Order Product Id', orderProductId);
				
				var OrderId = ordProdId.getValue('custrecord_is_cl_order');
				nlapiLogExecution('DEBUG', 'Order Id', OrderId);
				
				var item = ordProdId.getValue('custrecord_is_cl_item');
				nlapiLogExecution('DEBUG', 'Item', item);
				
				
				//Check if Existing Order Product Record with Order / Item Combination
				var existProjSearch = is_calop_getExistProj(OrderId, item);
				
				if (existProjSearch){
					var existProj = existProjSearch[0].getValue('custrecord_is_cl_job');
					nlapiLogExecution('DEBUG', 'Existing Project', existProj);
					projAction = 'Consolidate';
				}else{
					projAction = 'Create';
				}
				
				nlapiLogExecution('DEBUG', 'Project Action', projAction);
				
				
				//Create New Project Code
				if (projAction == 'Create'){
					
					nlapiLogExecution('DEBUG', 'Criteria Met for Project Creation', 'CREATE PROJECT');
					
					//Get Values from Order Record
					var orderFields = nlapiLookupField('customrecord_order', OrderId, ['custrecord_is_ord_entity', 'custrecord_is_ord_subsidiary', 'custrecord_is_ord_sf_opportunity_id', 'custrecord_is_ord_currency', 'custrecord_is_ord_sales_geo', 'custrecord_is_ord_oppty_close_date', 'custrecord_is_ord_shipattention', 'custrecord_is_ord_shipaddressee', 'custrecord_is_ord_shipphone', 'custrecord_is_ord_shipaddr1', 'custrecord_is_ord_shipaddr2', 'custrecord_is_ord_shipcity', 'custrecord_is_ord_shipstate', 'custrecord_is_ord_shipzip', 'custrecord_is_ord_shipcountry', 'custrecord_is_ord_enduser', 'custrecord_ord_satclause_type', 'custrecord_ord_satclause_termlength']);
					
					var opptyCloseDate = orderFields.custrecord_is_ord_oppty_close_date;
	                nlapiLogExecution('DEBUG', 'opptyCloseDate', opptyCloseDate);

	                nlapiLogExecution('DEBUG', 'Order Fields', orderFields);
	                
	                
	                var itemName = ordProdId.getText('custrecord_is_cl_item');
	                //var amt = newRecord.getValue('custrecord_is_cl_amount');
	                var amt = ordProdId.getValue('custrecord_is_cl_totalprice');
	                var qty = ordProdId.getValue('custrecord_is_cl_quantity');
	                //var erp = ordProdId.getValue('custrecord_is_cl_class');
	                var erp = ordProdId.getValue('custrecord_op_erp');
	                var location = ordProdId.getValue('custrecord_is_cl_location');
	                var serviceType = ordProdId.getValue('custrecord_is_cl_service_type');
	                var erpVersion = ordProdId.getValue('custrecord_is_cl_erp_version');
	                var prodFamily = ordProdId.getValue('custrecord_is_cl_product_family');
	                var delType = ordProdId.getValue('custrecord_is_cl_delivery_type');
	                //var svcsContact = ordProdId.getValue('custrecord_is_cl_services_contact');//CHECK W MATT VICKY
	                var billSched = ordProdId.getValue('custrecord_is_cl_billingschedule');
	                var satisfClause = ordProdId.getValue('custrecord_is_cl_satisfaction_clause_req');
	                var busLine = ordProdId.getValue('custrecord_is_cl_so_business_line');
	                var billingType = ordProdId.getValue('custrecord_is_cl_billing_type');
	                var poNumber = ordProdId.getValue('custrecord_is_cl_otherrefnum');
	                var oaRevRecRule = ordProdId.getValue('custrecord_is_cl_oa_rev_rec_rule');
	                var termStartDate = ordProdId.getValue('custrecord_is_cl_term_start_date');
	                var termEndDate = ordProdId.getValue('custrecord_is_cl_term_end_date');
	                var revRecStartDate = ordProdId.getValue('custrecord_is_revrec_startdate');
	                var revRecEndDate = ordProdId.getValue('custrecord_is_revrec_enddate');
	                var oaBusinessLine = ordProdId.getValue('custrecord_op_oa_business_line');
	                var svcProjName = ordProdId.getValue('custrecord_svc_project_name');
	                
	                nlapiLogExecution('DEBUG', 'revRecStartDate', revRecStartDate);
	                nlapiLogExecution('DEBUG', 'revRecEndDate', revRecEndDate);
	                
	                var projTemplate = ordProdId.getValue('custrecord_is_cl_oa_proj_temp');
	                nlapiLogExecution('DEBUG', 'Project Template', projTemplate);
	                
	                
	                
	                //Create/Set Project
	            	var projRec = nlapiCreateRecord('job');
	            	
	            	
	            	//Set values on Project Record
	                //Set the Template Value on the Project Record, and check off the Export to OpenAir checkbox
	                projRec.setFieldValue('custentity_oa_project_template', projTemplate);
	                projRec.setFieldValue('custentity_oa_export_to_openair', 'T');
	                

	                //Set Body Fields on Project Record

	                //From Order
                    projRec.setFieldValue('parent', orderFields.custrecord_is_ord_entity);
                    projRec.setFieldValue('subsidiary', orderFields.custrecord_is_ord_subsidiary);
	                projRec.setFieldValue('custentity_sf_opportunity_id_project', orderFields.custrecord_is_ord_sf_opportunity_id);
	                projRec.setFieldValue('custentity_so_currency', orderFields.custrecord_is_ord_currency);
	                projRec.setFieldValue('currency', orderFields.custrecord_is_ord_currency);
	                projRec.setFieldValue('custentity_sales_geo', orderFields.custrecord_is_ord_sales_geo);
                    projRec.setFieldValue('custentity_oppty_close_date', opptyCloseDate);
	                projRec.setFieldValue('custentity_so_ship_attn', orderFields.custrecord_is_ord_shipattention);
	                projRec.setFieldValue('custentity_so_ship_addressee', orderFields.custrecord_is_ord_shipaddressee);
	                projRec.setFieldValue('custentity_so_ship_phone', orderFields.custrecord_is_ord_shipphone);
	                projRec.setFieldValue('custentity_so_ship_addr1', orderFields.custrecord_is_ord_shipaddr1);
	                projRec.setFieldValue('custentity_so_ship_addr2', orderFields.custrecord_is_ord_shipaddr2);
	                projRec.setFieldValue('custentity_so_ship_city', orderFields.custrecord_is_ord_shipcity);
	                projRec.setFieldValue('custentity_so_ship_state', orderFields.custrecord_is_ord_shipstate);
	                projRec.setFieldValue('custentity_so_ship_zip', orderFields.custrecord_is_ord_shipzip);
	                projRec.setFieldValue('custentity_so_ship_country', orderFields.custrecord_is_ord_shipcountry);
	                projRec.setFieldValue('custentity_sat_clause_type', orderFields.custrecord_ord_satclause_type);
                    projRec.setFieldValue('custentity_sat_clause_term_length', orderFields.custrecord_ord_satclause_termlength);
                    projRec.setFieldValue('custentity_so_end_user_customer', orderFields.custrecord_is_ord_enduser);
					
                    
                    //From Order Product Record
                    projRec.setFieldValue('custentity_so_amount', amt);
                    projRec.setFieldValue('custentity_so_quantity', qty);
                    projRec.setFieldValue('companyname', itemName);
                    projRec.setFieldValue('custentity_so_erp', erp);
                    projRec.setFieldValue('custentity_delivery_type', delType);
                    //projRec.setFieldValue('custentity_services_contact', svcsContact);//CHECK W MATT VICKY
                    //projRec.setFieldValue('custentity_so_billing_schedule', billSched);
                    projRec.setFieldValue('custentity_op_billing_schedule', billSched);
                    //projRec.setFieldValue('custentity_satisfaction_clause_required', (satisfClause) ? satisfClause : false);
                    projRec.setFieldValue('custentity_so_business_line', busLine);
                    projRec.setFieldValue('custentity_so_product_line', location);
                    projRec.setFieldValue('custentity_serv_type', serviceType);
                    projRec.setFieldValue('custentity_so_erp_version', erpVersion);
                    projRec.setFieldValue('custentity_so_product_family', prodFamily);
                    projRec.setFieldValue('custentity_so_billing_type', billingType);
                    projRec.setFieldValue('custentity_so_po_number', poNumber);
                    projRec.setFieldValue('custentity_oa_rev_rec_rule', oaRevRecRule);
                    projRec.setFieldValue('custentity_rev_rec_start_date', revRecStartDate);
                    projRec.setFieldValue('custentity_rev_rec_end_date', revRecEndDate);
                    projRec.setFieldValue('custentity_oa_business_line', oaBusinessLine);
                    projRec.setFieldValue('custentity_job_svc_project_name', svcProjName);

                    //Check 'Created by Script' to indicate project was created by script
                    projRec.setFieldValue('custentity_scg_created_by_script', 'T');
                    
                    
                    //Submit Record
                    var projectRecord = nlapiSubmitRecord(projRec);
                    nlapiLogExecution('DEBUG', 'Project ID', projectRecord);
					
                    
                    //Set the New Project Record on the Line
                    if (projectRecord) {
                        var submitProject = nlapiSubmitField('customrecord_contractlines', orderProductId, ['custrecord_is_cl_job', 'custrecord_is_cl_create_proj_by_script'], [projectRecord, 'F']);
                    }
                    
	                
				}//End if (projAction == 'Create')
				
				
				
				
				if (projAction == 'Consolidate'){
					
					nlapiLogExecution('DEBUG', 'Criteria Met for Project Consolidation', 'CONSOLIDATE PROJECT');
					
					var amt = ordProdId.getValue('custrecord_is_cl_totalprice');
	                var qty = ordProdId.getValue('custrecord_is_cl_quantity');
	                
	                nlapiLogExecution('DEBUG', 'Order Product Amt = ' + amt, 'Order Product Qty = ' + qty);
	                
	                var projFields = nlapiLookupField('job', existProj, ['custentity_so_quantity', 'custentity_so_amount']);
                    var projAmt = projFields.custentity_so_amount;
                    var projQty = projFields.custentity_so_quantity;
                    nlapiLogExecution('DEBUG', 'projAmt = ' + projAmt, 'projQty = ' + projQty);

                    var newProjAmt = Number(projAmt) + Number(amt);
                    var newProjQty = Number(projQty) + Number(qty);
                    nlapiLogExecution('DEBUG', 'new Proj Amt = ' + newProjAmt, 'new Proj Qty = ' + newProjQty);

                    //Update values on existing Project Record
                    nlapiSubmitField('job', existProj, ['custentity_so_quantity', 'custentity_so_amount', 'custentity_oa_export_to_openair'], [newProjQty, newProjAmt, 'T']);
                    
                    //Set the Updated Project Record on the Order Product Record
                    nlapiSubmitField('customrecord_contractlines', orderProductId, ['custrecord_is_cl_job', 'custrecord_is_cl_create_proj_by_script'], [existProj, 'F']);
                    
                    
				}//End if (projAction == 'Consolidate')
				
				
				count = count + 1;
				
				
			} catch ( e ) {
				var errorMessage = '';
				if (e instanceof nlobjError) {
					if (e.getCode() == 'SSS_USAGE_LIMIT_EXCEEDED') {
						nlapiLogExecution('debug','Usage Exceeded on script:', 'SCG_Create_VP_Lockbox_Payments_SS');
						var state = nlapiYieldScript();
						if (state.status == 'FAILURE') {
								nlapiLogExecution("ERROR","Failed to reschedule script, exiting: Reason = "+state.reason + " / Size = "+ state.size + " / Info = "+ state.information);
								throw "Failed to reschedule script";
						} else if ( state.status == 'RESUME' ) {
							nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
						}
						startUsage = nlapiGetContext().getRemainingUsage();
					} else if (e.getCode() == 'RCRD_DSNT_EXIST') {
						nlapiLogExecution( 'DEBUG', 'Record Doesn\'t Exist', orderProductId );
					} else {
						errorMessage = e.getCode() + '\n' + e.getDetails();
						nlapiLogExecution( 'DEBUG', 'system error', errorMessage );
					}
				} else {
					errorMessage = e.toString();
					nlapiLogExecution( 'DEBUG', 'unexpected error', errorMessage );
				}
			}
		});
		
		
		// Check for any additional records
		minRecId = orderProductId;
		nlapiLogExecution('DEBUG', 'minRecId after loop', minRecId);
		ordProdIds = is_calop_getCalumoOrdProdIds(minRecId);
		
	}//End while loop
	
	nlapiLogExecution('DEBUG', 'Count of Search Results', count);
	
	
}




/**
 * Processes each element of an array, checks remaining governance units 
 * and reschedules the script, if needed.
 * 
 * @appliedtorecord invoice
 * 
 * @param {Array} arr: array to be processed by the script
 * @param {Array} proc: function to be used to process each element of the array
 * @returns {Void}
 */
function is_calumoProjs_scheduledBatch(arr, proc) {

	// Initialize variables
	var maxUsage = 0;
	var startUsage = nlapiGetContext().getRemainingUsage();
	
	// Loop through the array
	for (var i in arr){
		// Process the current array value
		proc(arr[i], i, arr);
		
		// Update the percent complete value on the script status page
		if (nlapiGetContext().getExecutionContext() == "scheduled") nlapiGetContext().setPercentComplete( ((100*i)/arr.length ).toFixed(1));
		
		// Track governance and reschedule script, if needed
		var endUsage = nlapiGetContext().getRemainingUsage();
		var runUsage = startUsage - endUsage;
		//nlapiLogExecution('debug', 'End Usage / Run Usage', endUsage + ' / ' + runUsage);
		if (maxUsage < runUsage) maxUsage = runUsage;
		if (endUsage < (maxUsage + 40)){
			var state = nlapiYieldScript();
			if (state.status == 'FAILURE') {
					nlapiLogExecution("ERROR","Failed to reschedule script, exiting: Reason = "+state.reason + " / Size = "+ state.size + " / Info = "+ state.information);
					throw "Failed to reschedule script";
			} else if ( state.status == 'RESUME' ) {
				nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
			}
			startUsage = nlapiGetContext().getRemainingUsage();
		} else {
			startUsage = endUsage;
		}
	}
}




/**
 * Returns a list of Order Products to be processed (to create / combine Project records)
 * 
 * @appliedtorecord customrecord_contractlines
 * 
 * @returns {nlobjSearch}
 */
function is_calop_getCalumoOrdProdIds(minRecId) {
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custrecord_is_cl_so_business_line', null, 'anyof', CALUMO));
	filters.push(new nlobjSearchFilter('custrecord_is_cl_create_proj_by_script', null, 'is', 'T'));
	filters.push(new nlobjSearchFilter('custrecord_is_cl_job', null, 'anyof', '@NONE@'));
	filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', minRecId));
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['92', '646001', '63888']));//TEMPORARY FILTER FOR TESTING
	//filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ['38881']));//TEMPORARY FILTER FOR TESTING

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('name', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_order', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_so_business_line', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_create_proj_by_script', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_job', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_item', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_totalprice', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_quantity', null, null));
	//columns.push(new nlobjSearchColumn('custrecord_is_cl_class', null, null));
	columns.push(new nlobjSearchColumn('custrecord_op_erp', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_location', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_service_type', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_erp_version', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_product_family', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_delivery_type', null, null));
	//columns.push(new nlobjSearchColumn('custrecord_is_cl_services_contact', null, null));//CHECK W MATT VICKY
	columns.push(new nlobjSearchColumn('custrecord_is_cl_billingschedule', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_satisfaction_clause_req', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_so_business_line', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_billing_type', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_otherrefnum', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_oa_rev_rec_rule', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_term_start_date', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_term_end_date', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_revrec_startdate', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_revrec_enddate', null, null));
	columns.push(new nlobjSearchColumn('custrecord_op_oa_business_line', null, null));
	columns.push(new nlobjSearchColumn('custrecord_svc_project_name', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_oa_proj_temp', null, null));
	columns[0].setSort(false /* ascending */);
	
	return nlapiSearchRecord('customrecord_contractlines', null, filters, columns);
}






function is_calop_getExistProj(OrderId, item){
	
	// Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custrecord_is_cl_order', null, 'anyof', OrderId));
	filters.push(new nlobjSearchFilter('custrecord_is_cl_item', null, 'anyof', item));
	filters.push(new nlobjSearchFilter('custrecord_is_cl_job', null, 'noneof', '@NONE@'));

	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	columns.push(new nlobjSearchColumn('custrecord_is_cl_job', null, null));
	columns[0].setSort(false /* ascending */);

	return nlapiSearchRecord('customrecord_contractlines', null, filters, columns);
	
}






function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}  




