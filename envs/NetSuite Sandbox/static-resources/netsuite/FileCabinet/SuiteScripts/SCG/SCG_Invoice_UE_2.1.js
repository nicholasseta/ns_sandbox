/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', './SCG_Transactions_UE_LB'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search, lib) => {
        const ORDER_TYPE_RENEWAL = '3';
        const DUE_ON_RECEIPT = '4';

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
              	let now = new Date();
                log.debug({ title: 'beforeSubmit Start', details: now });
                const type = scriptContext.type;
                let rec = scriptContext.newRecord;
                //log.debug({ title: 'beforeSubmit', details: rec.id });
                if (type === scriptContext.UserEventType.CREATE) {
                    lib.isInvSetRemittance(rec);
                    lib.isInvSetToBeEmailedValue(rec);
                    const orderType = rec.getValue('custbody_so_ordertype');
                    if (orderType.toString() === ORDER_TYPE_RENEWAL) {
                        lib.isInvSetDueDate(rec, DUE_ON_RECEIPT);
                    }
                }
                if (type === scriptContext.UserEventType.CREATE || type === scriptContext.UserEventType.EDIT || type === scriptContext.UserEventType.XEDIT) {
                    lib.printInvoiceHtml(rec);
                }
              	now = new Date();
              	log.debug({ title: 'beforeSubmit Complete', details: now });
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
              	let now = new Date();
                log.debug({ title: 'afterSubmit Start', details: now });
                const type = scriptContext.type;
                let rec = scriptContext.newRecord;
                if (type === scriptContext.UserEventType.CREATE || type === scriptContext.UserEventType.EDIT || type === scriptContext.UserEventType.XEDIT) {
                    rec = record.load({ type: rec.type, id: rec.id });
                    now = new Date();
                    log.debug({ title: 'recordLoad Complete', details: now });
                    lib.setPdfBase64(rec);
                    now = new Date();
                    log.debug({ title: 'base64 Complete', details: now });
                    if (type === scriptContext.UserEventType.CREATE) {
                      rec.setValue('custbody_scg_record_status', '1');
                    }
                    if (type === scriptContext.UserEventType.EDIT) {
                        lib.isInvUpdRecordStatus(rec);
                    }
                    now = new Date();
                    log.debug({ title: 'statusSearch Complete', details: now });
                    rec.save();
                    now = new Date();
                    log.debug({ title: 'save Complete', details: now });
                }
              	now = new Date();
              	log.debug({ title: 'afterSubmit Complete', details: now });
            }
            catch (ex) {
                lib.errorLog(ex);
            }
        }

        return {
            //beforeLoad,
            beforeSubmit,
            afterSubmit
        }
    });
