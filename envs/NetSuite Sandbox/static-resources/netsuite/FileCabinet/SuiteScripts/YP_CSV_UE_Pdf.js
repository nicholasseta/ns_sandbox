/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @author Chelsea Fagen
 */
define(["N/file", "N/render", "N/record", "N/runtime", "N/task"],

    function (file, render, record, runtime, task) {

        var PDF_FOLDER = 680761;    

        var UPDATE_INVOICE_PDFS_MAP_REDUCE_SCRIPT_ID = "customscript_yp_mr_updateinvoicepdfs";

        /**
         * @description Creates/updates PDF invoices
         *
         * @param {Object} scriptContext
         * @param {record.Record} scriptContext.newRecord - New record
         * @param {record.Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         */
        function afterSubmit(scriptContext) {

            try {
                // If the script is not triggered by csv import
                if (runtime.executionContext !== runtime.ContextType.CSV_IMPORT) {

                    if (scriptContext.newRecord.type === record.Type.INVOICE) {

                        invoicePdf(scriptContext);

                    } else if (scriptContext.newRecord.type === record.Type.CUSTOMER_PAYMENT) {

                        updateInvoicePdf(scriptContext);

                    } else if (scriptContext.newRecord.type === record.Type.CREDIT_MEMO) {

                        updateInvoicePdf(scriptContext);

                    }
                }

            } catch (e) {
                log.error("Script Error", e);
            }

        }

        return {
            afterSubmit: afterSubmit
        };

        /**
         * @description Deletes old PDF, creates PDF of invoice and saves to file cabinet
         *
         * @param {Number} invoiceRecordId
         * @param {Number} invoiceRecordPdfInternalId
         */
        function createInvoice(invoiceRecordId, invoiceRecordPdfInternalId) {

            // Delete old invoice
            if (invoiceRecordPdfInternalId) {

                file.delete({
                    id: invoiceRecordPdfInternalId
                });

            }

            var pdfFile = render.transaction({
                entityId: Number(invoiceRecordId),
                printMode: render.PrintMode.PDF
            });

            if (!pdfFile) return;

            pdfFile.folder = PDF_FOLDER;

            var pdfFileId = pdfFile.save();
            log.debug("pdfFileId", pdfFileId);

            record.submitFields({
                type: record.Type.INVOICE,
                id: invoiceRecordId,
                values: {
                    custbody_yp_pdf: pdfFileId
                }
            });

        }

        /**
         * @description Calls map/reduce script that updates invoice PDFs
         *
         * @param {Number} originRecordId
         * @param {String} originRecordType
         */
        function updateInvoicePdf(scriptContext) {

            var transactionRecord = scriptContext.newRecord;

            var invoiceArray = [];

            var applyLineCount = transactionRecord.getLineCount({
                sublistId: "apply"
            });

            for (var i = 0; i < applyLineCount; i++) {

                var applyTranType = transactionRecord.getSublistValue({
                    sublistId: "apply",
                    fieldId: "trantype",
                    line: i
                });
                if (applyTranType != "CustInvc") continue;

                var invoiceRecordId = transactionRecord.getSublistValue({
                    sublistId: "apply",
                    fieldId: "internalid",
                    line: i
                });
                if (!invoiceRecordId) continue;

                invoiceArray.push({
                    invoiceRecordId: invoiceRecordId,
                    transactionLineNumber: i
                });

            }

            var updateInvoicePdfsMapReduceTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: UPDATE_INVOICE_PDFS_MAP_REDUCE_SCRIPT_ID,
                params: {
                    "custscript_yp_invoicearray": JSON.stringify(invoiceArray)
                }
            });

            var updateInvoicePdfsMapReduceTaskId = updateInvoicePdfsMapReduceTask.submit();
            log.debug("updateInvoicePdfsMapReduceTaskId", updateInvoicePdfsMapReduceTaskId);

        }

        /**
         * @description Gets information to create PDF from an invoice record
         *
         * @param {Object} scriptContext
         */
        function invoicePdf(scriptContext) {

            var invoiceRecord = scriptContext.newRecord;

            if (!invoiceRecord) return;

            var invoiceRecordStatusRef = invoiceRecord.getValue({
                fieldId: "statusRef"
            });

            // If invoice is already paid do not save PDF
            if (invoiceRecordStatusRef === "paidInFull") return;

            var invoiceRecordId = invoiceRecord.id;

            var invoiceRecordPdfInternalId = invoiceRecord.getValue({
                fieldId: "custbody_yp_pdf"
            });

            createInvoice(invoiceRecordId, invoiceRecordPdfInternalId);

        }

    });
