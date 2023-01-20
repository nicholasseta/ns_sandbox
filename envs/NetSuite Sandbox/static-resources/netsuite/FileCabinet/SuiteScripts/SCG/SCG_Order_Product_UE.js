/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', './SCG_Transactions_UE_LB', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, lib, search) => {
        const CREATE_PLAN_ON_ID = '1'

        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            try {

            }
            catch (ex) {
                lib.errorLog(ex);
            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            try {
                const type = scriptContext.type;
                if (type === scriptContext.UserEventType.EDIT || type === scriptContext.UserEventType.XEDIT) {
                    let rec = scriptContext.newRecord;
                    const oldRec = scriptContext.oldRecord;
                    const totalPrice = rec.getValue({ fieldId: 'custrecord_is_cl_totalprice' });
                    const oldTotalPrice = oldRec.getValue({ fieldId: 'custrecord_is_cl_totalprice' });
                    //log.debug({ title: 'prices', details: `${totalPrice} ${oldTotalPrice}`});
                    if (totalPrice !== oldTotalPrice) {
                        const createElement = rec.getValue({ fieldId: 'custrecord_is_cl_create_forecast_plan'});
                        const revElement = rec.getValue({ fieldId: 'custrecord_is_cl_revenue_element'});
                        if (revElement) {
                            const revElementLookup = search.lookupFields({ type: 'revenueelement', id: revElement, columns: ['createrevenueplanson']});
                            const createPlansOn = revElementLookup.createrevenueplanson[0].value;
                            //log.debug({ title: 'revenueelement.createPlansOn revElement create', details: `${createPlansOn} ${revElement} ${createElement}`});
                            if (createPlansOn === CREATE_PLAN_ON_ID && !createElement) {
                                rec = record.load({ type: rec.type, id: rec.id });
                                record.submitFields({ type: rec.type, id: rec.id, values: { 'custrecord_scg_update_rev_event': true }});
                                //log.debug({ title: 'updated'});
                            }
                        }
                    }
                }
            }
            catch (ex) {
                lib.errorLog(ex);
            }
        }

        return {
            //beforeLoad,
            //beforeSubmit,
            afterSubmit
        }
    });
