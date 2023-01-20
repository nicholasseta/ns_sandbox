/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType UserEventScript
 * @see https://system.netsuite.com/app/help/helpcenter.nl?fid=section_4387799721.html
 * 
 * Version    Date            Author                   Remarks
 * 1.00       22 Feb 2021     Darryl Lutchmipersad     Scheduled Script to create Customer Payment records from VP Lockbox custom records
 * 1.05       25 Oct 2021     Doug Humberd             Updated with changes provided by Matt Poloni
 * 1.06       29 Oct 2021     Matt Poloni              Added if blocks to guard against null values
 * 1.07       30 Oct 2021     Matt Poloni              Added Service Project Name field
 * 1.08       16 Dec 2021     Matt Poloni              Updated for OP Billing Schedule's source changing to List/Record type
 * 1.09       28 Dec 2021     Matt Poloni              Updated billSched to use getText/setText
 * 1.10       04 Jan 2022     Matt Poloni              Updating Billing Schedule for SO Billing Schedule
 * 1.11       17 Feb 2022     Matt Poloni              Added Data Load Type field
 * 1.11       28 Feb 2022     Greg DelVecchio          Added Salesforce Order Product ID field to the Project
 * 1.12       26 Jul 2022     Doug Humberd             Updated to append a date value (RR Start from Ord Product) in the Project Name
 * 
 */
define(['N/search', 'N/record', 'N/format'],

	/**
	 * @return {{
	 *   beforeLoad?: Function,
	 *   beforeSubmit?: Function,
	 *   afterSubmit?: Function,
	 * }}
	 */
	function (search, record, format) {

		/**
		 * @param {BeforeLoadContext} context
		 * @return {void}
		 */
		function beforeLoad(context) {
			try {

				log.audit('beforeLoad', {
					type: context.type,
					form: context.form,
					newRecord: {
						type: context.newRecord.type,
						id: context.newRecord.id,
					},
					request: !context.request ? null : {
						url: context.request.url,
						parameters: context.request.parameters,
					},
				});

			} catch (e) {
				log.error('beforeLoad', JSON.parse(JSON.stringify(e)));
			}
		}

		/**
		 * @param {BeforeSubmitContext} context
		 * @return {void}
		 */
		function beforeSubmit(context) {
			try {
				log.audit('beforeSubmit', {
					type: context.type,
					newRecord: {
						type: context.newRecord.type,
						id: context.newRecord.id,
					},
					oldRecord: {
						type: context.oldRecord.type,
						id: context.oldRecord.id,
					},
				});
			} catch (e) {
				log.error('beforeSubmit', JSON.parse(JSON.stringify(e)));
			}
		}

		/**
		 * @param {AfterSubmitContext} context
		 * @return {void}
		 */
		function afterSubmit(context) {
			try {
				log.audit('afterSubmit', {
					type: context.type,
					newRecord: {
						type: context.newRecord.type,
						id: context.newRecord.id,
					}
					//oldRecord: {
					//  type: context.oldRecord.type,
					//  id: context.oldRecord.id,
					//},
				});

				is_so_createProjects(context);


			} catch (e) {
				log.error('afterSubmit', JSON.parse(JSON.stringify(e)));
			}
		}


		function is_so_createProjects(context) {

			var type = context.type;
			var newRecord = context.newRecord;
			// var oldRecord = context.oldRecord;

			log.debug('type = ' + type, 'createProjects START');
			//log.debug('newRecord', newRecord);

			//Add new logic to grab header information from Contract
			//Aftersubmit on Contract Line
			//Get Values for project creation criteria

			var contractLineId = newRecord.id

			var existProj = newRecord.getValue('custrecord_is_cl_job');
			log.debug('Existing Project ', existProj);

			var createProj = newRecord.getValue('custrecord_is_cl_create_proj_by_script');
			log.debug('Create Project by Script =', createProj);

			var origProjOrdId = newRecord.getValue('custrecord_is_cl_orig_project_order_id');
			log.debug('Original Project Order ID Line ', origProjOrdId);

			var OrderId = newRecord.getValue('custrecord_is_cl_order');

			//Create New Project Code
			if (isEmpty(existProj) && createProj == true && isEmpty(origProjOrdId)) {

				log.debug('Criteria Met for Project Creation', 'CREATE PROJECT');

				var orderFields = search.lookupFields({
					type: 'customrecord_order',
					id: OrderId,
					columns: ['custrecord_is_ord_entity',
						'custrecord_is_ord_subsidiary',
						'custrecord_is_ord_sf_opportunity_id',
						'custrecord_is_ord_currency',
						'custrecord_is_ord_sales_geo',
						'custrecord_is_ord_oppty_close_date',
						'custrecord_is_ord_shipattention',
						'custrecord_is_ord_shipaddressee',
						'custrecord_is_ord_shipphone',
						'custrecord_is_ord_shipaddr1',
						'custrecord_is_ord_shipaddr2',
						'custrecord_is_ord_shipcity',
						'custrecord_is_ord_shipstate',
						'custrecord_is_ord_shipzip',
						'custrecord_is_ord_shipcountry',
						'custrecord_is_ord_enduser',
						'custrecord_ord_satclause_type',
						'custrecord_ord_satclause_termlength'
					]
				});

				if (!isEmpty(orderFields.custrecord_is_ord_oppty_close_date)) {
					var opptyCloseDate = new Date(orderFields.custrecord_is_ord_oppty_close_date)
					log.debug('opptyCloseDate', opptyCloseDate)
				}

				log.debug('Order Fields', orderFields)
				//log.debug('custrecord_is_ord_entity', orderFields.custrecord_is_ord_entity[0].value)

				var item = newRecord.getValue('custrecord_is_cl_item');


				var itemFields = search.lookupFields({
					type: search.Type.ITEM,
					id: item,
					columns: ['itemid']
				});
				log.debug('itemFields', itemFields);

				var itemName = '';
				if (!isEmpty(itemFields.itemid)) {
					itemName = itemFields.itemid;
				}
				log.debug('itemName', itemName);


				//var itemName = newRecord.getText('custrecord_is_cl_item');
				//var amt = newRecord.getValue('custrecord_is_cl_amount');
				var amt = newRecord.getValue('custrecord_is_cl_totalprice');
				var qty = newRecord.getValue('custrecord_is_cl_quantity');
				var erp = newRecord.getValue('custrecord_op_erp');
				var location = newRecord.getValue('custrecord_is_cl_location');
				var serviceType = newRecord.getValue('custrecord_is_cl_service_type');
				var erpVersion = newRecord.getValue('custrecord_is_cl_erp_version');
				var prodFamily = newRecord.getValue('custrecord_is_cl_product_family');
				var delType = newRecord.getValue('custrecord_is_cl_delivery_type');
				var svcsContact = newRecord.getValue('custrecord_is_cl_services_contact');
				var billSched = newRecord.getValue('custrecord_is_cl_billingschedule');
				var satisfClause = newRecord.getValue('custrecord_is_cl_satisfaction_clause_required');
				var busLine = newRecord.getValue('custrecord_is_cl_so_business_line');
				var billingType = newRecord.getValue('custrecord_is_cl_billing_type');
				var poNumber = newRecord.getValue('custrecord_op_po_number');
				var oaRevRecRule = newRecord.getValue('custrecord_is_cl_oa_rev_rec_rule');
				var termStartDate = newRecord.getValue('custrecord_is_cl_term_start_date');
				var termEndDate = newRecord.getValue('custrecord_is_cl_term_end_date');
				var revRecStartDate = (newRecord.getValue('custrecord_is_revrec_startdate')).toString();
				var revRecEndDate = (newRecord.getValue('custrecord_is_revrec_enddate')).toString();
				var oaBusinessLine = newRecord.getValue('custrecord_op_oa_business_line');
				var svcProjName = newRecord.getValue('custrecord_svc_project_name');
				var dataLoadContext = newRecord.getValue('custrecord_op_data_load_context');
				var sfOrderProductId = newRecord.getValue('custrecord_is_cl_source_ext_id');

				log.debug('revRecStartDate', revRecStartDate)
				log.debug('revRecEndDate', revRecEndDate)
				
				//Grab RR Start in new variable
				var rrStartObj = (newRecord.getValue('custrecord_is_revrec_startdate'));
				log.debug('Rev Rec Start Obj', rrStartObj);
				
				var rrStartDate = format.format({value:rrStartObj, type: format.Type.DATE});
				log.debug('rrStartDate (Formatted)', rrStartDate);
				
				//Append the Rev Rec Start Date to the Item Name - to be written as the Project Name
				itemName = itemName + ' ' + rrStartDate;
				log.debug('Item Name with RR Start Appended', itemName);

				var projTemplate = newRecord.getValue('custrecord_is_cl_oa_proj_temp');
				log.debug('Project Template', projTemplate);

				var projRec = record.create({
					type: record.Type.JOB,
					isDynamic: true,
				});

				//Set values on Project Record
				//Set the Template Value on the Project Record, and check off the Export to OpenAir checkbox
				projRec.setValue('custentity_oa_project_template', projTemplate);
				projRec.setValue('custentity_oa_export_to_openair', true);

				//Set Body Fields on Project Record

				//From Order
				if (orderFields.custrecord_is_ord_entity[0]) {
					projRec.setValue('parent', orderFields.custrecord_is_ord_entity[0].value);
				}
				if (orderFields.custrecord_is_ord_subsidiary) {
					projRec.setValue('subsidiary', orderFields.custrecord_is_ord_subsidiary[0].value);
				}
				projRec.setValue('custentity_sf_opportunity_id_project', orderFields.custrecord_is_ord_sf_opportunity_id);
				if (orderFields.custrecord_is_ord_currency[0]) {
					projRec.setValue('custentity_so_currency', orderFields.custrecord_is_ord_currency[0].value);
					projRec.setValue('currency', orderFields.custrecord_is_ord_currency[0].value);
				}
				if (orderFields.custrecord_is_ord_sales_geo[0]) {
					projRec.setValue('custentity_sales_geo', orderFields.custrecord_is_ord_sales_geo[0].value);
				}
				if (opptyCloseDate) {
					projRec.setValue('custentity_oppty_close_date', opptyCloseDate);
				}
				projRec.setValue('custentity_so_ship_attn', orderFields.custrecord_is_ord_shipattention);
				projRec.setValue('custentity_so_ship_addressee', orderFields.custrecord_is_ord_shipaddressee);
				projRec.setValue('custentity_so_ship_phone', orderFields.custrecord_is_ord_shipphone);
				projRec.setValue('custentity_so_ship_addr1', orderFields.custrecord_is_ord_shipaddr1);
				projRec.setValue('custentity_so_ship_addr2', orderFields.custrecord_is_ord_shipaddr2);
				projRec.setValue('custentity_so_ship_city', orderFields.custrecord_is_ord_shipcity);
				projRec.setValue('custentity_so_ship_state', orderFields.custrecord_is_ord_shipstate);
				projRec.setValue('custentity_so_ship_zip', orderFields.custrecord_is_ord_shipzip);
				projRec.setValue('custentity_so_ship_country', orderFields.custrecord_is_ord_shipcountry);
				if (orderFields.custrecord_ord_satclause_type[0]) {
					projRec.setValue('custentity_sat_clause_type', orderFields.custrecord_ord_satclause_type[0].value);
				}
				if (orderFields.custrecord_ord_satclause_termlength) {
					projRec.setValue('custentity_sat_clause_term_length', orderFields.custrecord_ord_satclause_termlength);
				}
				//projRec.setValue('custentity_so_end_user_customer',(orderFields.custrecord_is_ord_enduser) ? orderFields.custrecord_is_ord_enduser : TBD);
				if (orderFields.custrecord_is_ord_enduser[0]) {
					projRec.setValue('custentity_so_end_user_customer', orderFields.custrecord_is_ord_enduser[0].value);
				}


				//From Contract Line
				projRec.setValue('custentity_so_amount', amt);
				projRec.setValue('custentity_so_quantity', qty);
				projRec.setValue('companyname', itemName);
				projRec.setValue('custentity_so_erp', erp);
				projRec.setValue('custentity_delivery_type', delType);
				projRec.setValue('custentity_services_contact', svcsContact);
				//projRec.setValue('custentity_so_billing_schedule', billSched);
				if (!isEmpty(billSched)) {
					projRec.setValue('custentity_so_billing_schedule', billSched);
				}
				//projRec.setValue('custentity_satisfaction_clause_required', (satisfClause) ? satisfClause : false);
				projRec.setValue('custentity_so_business_line', busLine);
				projRec.setValue('custentity_so_product_line', location);
				projRec.setValue('custentity_serv_type', serviceType);
				projRec.setValue('custentity_so_erp_version', erpVersion);
				projRec.setValue('custentity_so_product_family', prodFamily);
				projRec.setValue('custentity_so_billing_type', billingType);
				projRec.setValue('custentity_so_po_number', poNumber);
				projRec.setValue('custentity_oa_rev_rec_rule', oaRevRecRule);
				projRec.setValue('custentity_rev_rec_start_date', revRecStartDate);
				projRec.setValue('custentity_rev_rec_end_date', revRecEndDate);
				projRec.setValue('custentity_oa_business_line', oaBusinessLine);
				projRec.setValue('custentity_job_svc_project_name', svcProjName);
				projRec.setValue('custentity_data_load_context', dataLoadContext);
				projRec.setValue('custentity_sf_order_product_id', sfOrderProductId);

				//Check 'Created by Script' to indicate project was created by script
				projRec.setValue('custentity_scg_created_by_script', true);

				//Submit Record

				var projectRecord = projRec.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				});
				log.debug('Project ID', projectRecord);

				//log.debug('Create Project Log');

				//Set the New Project Record on the Line
				if (projectRecord) {

					var submitProject = record.submitFields({
						type: 'customrecord_contractlines',
						id: contractLineId,
						values: {
							'custrecord_is_cl_job': projectRecord,
							'custrecord_is_cl_create_proj_by_script': false
						}
					});
					//newRecord.setValue('custrecord_is_cl_job', projectRecord);
					//newRecord.setValue('custrecord_is_cl_create_proj_by_script', false);
				}

			}//End if (isEmpty(existProj) && createProj == 'T' && isEmpty(origProjOrdId))


			//Set Existing Project Code
			//if (isEmpty(existProj) && createProj == 'T' && !isEmpty(origProjOrdId)){
			if (isEmpty(existProj) && !isEmpty(origProjOrdId)) {

				log.debug('Criteria Met to Set Existing Project', 'SET EXISTING PROJECT');

				//var amt = newRecord.getValue('custrecord_is_cl_amount');
				var amt = newRecord.getValue('custrecord_is_cl_totalprice');
				var qty = newRecord.getValue('custrecord_is_cl_quantity');

				log.debug('SO Amt = ' + amt, 'SO Qty = ' + qty);

				var projFields = search.lookupFields({
					type: search.Type.JOB,
					id: origProjOrdId,
					columns: ['custentity_so_quantity', 'custentity_so_amount']
				});
				var projAmt = projFields.custentity_so_amount;
				var projQty = projFields.custentity_so_quantity;
				log.debug('projAmt = ' + projAmt, 'projQty = ' + projQty);

				var newProjAmt = Number(projAmt) + Number(amt);
				var newProjQty = Number(projQty) + Number(qty);

				log.debug('new Proj Amt = ' + newProjAmt, 'new Proj Qty = ' + newProjQty);

				//Update values on existing Project Record
				var id = record.submitFields({
					type: record.Type.JOB,
					id: origProjOrdId,
					values: {
						custentity_so_quantity: newProjQty,
						custentity_so_amount: newProjAmt,
						custentity_oa_export_to_openair: true
					},
					options: {
						enableSourcing: false,
						ignoreMandatoryFields: true
					}
				});

				//Set the Updated Project Record on the Line
				var submitProject = record.submitFields({
					type: 'customrecord_contractlines',
					id: contractLineId,
					values: {
						'custrecord_is_cl_job': origProjOrdId,
						'custrecord_is_cl_create_proj_by_script': false
					}
				});
				//newRecord.setValue('custrecord_is_cl_job', origProjOrdId);


			}//End if (isEmpty(existProj) && createProj == 'T' && !isEmpty(origProjOrdId))



			log.audit('createProjects', 'END');

		}


		function isEmpty(stValue) {

			return ((stValue === '' || stValue == null || stValue == undefined) || (stValue.constructor === Array && stValue.length == 0) || (stValue.constructor === Object && (function (v) {
				for (var k in v)
					return false;
				return true;
			})(stValue)));

		};

		return {
			// beforeLoad: beforeLoad,
			// beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit,
		};

	}
);