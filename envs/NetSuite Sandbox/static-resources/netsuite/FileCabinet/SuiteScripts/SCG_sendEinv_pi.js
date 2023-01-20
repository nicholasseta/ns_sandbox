/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 */
/**
 * SAAS CONSULTING GROUP, LLC CONFIDENTIAL
 * Copyright (C) 2022 SaaS Consulting Group, LLC.
 * All Rights Reserved.
 *
 * NOTICE:
 * All information contained herein is, and remains the property of SaaS Consulting Group, LLC.
 * The intellectual and technical concepts contained herein are proprietary to SaaS Consulting Group, LLC and
 * may be covered by U.S. and Foreign Patents, patents in process, and are protected by trade secret or copyright law.
 *
 * Author: Danielle Sika
 * Created: 2022.10.10
 * Description: Sends E-Invoice to Maventa on "Send E-Doc" button
 *
 * Updated:
 * [YYYY.MM.DD] [Author] [Description]
 * 2022.12.07   D. Sika  Add check for sbx - don't run
 */
define(["require", "exports", "N/runtime", 'N/https', 'N/file', "./multipartupload", 'N/log'],
    function(require, exports, runtime, https, file, multiPartUpload_1, log) {
        Object.defineProperty(exports, "__esModule", { value: true });

        /**
         * send - This function is the entry point of our plugin script
         * @param {Object} plugInContext
         * @param {String} plugInContext.scriptId
         * @param {String} plugInContext.sendMethodId
         * @param {String} plugInContext.eInvoiceContent
         * @param {Object} plugInContext.customer
         * @param {String} plugInContext.customer.id
         * @param {Array}  plugInContext.customer.recipients
         * @param {Object} plugInContext.transaction
         * @param {String} plugInContext.transaction.number
         * @param {String} plugInContext.transaction.id
         * @param {String} plugInContext.transaction.poNum
         * @param {Object} plugInContext.sender
         * @param {String} plugInContext.sender.id
         * @param {String} plugInContext.sender.name
         * @param {String} plugInContext.sender.email
         * @param {Array} plugInContext.attachmentFileIds
         *
         * @returns {Object} result
         * @returns {Boolean} result.success
         * @returns {String} result.message
         */
        function send(pluginContext) {
            //var attachmentFileIds = pluginContext.attachmentFileIds;
            //dont run in sandbox - account ID will have SB in the name so index of location would be greater than 0
            var accountId = runtime.accountId;
            log.debug('account ID =', accountId);
            //log.debug('account ID check 1', accountId.includes("SB"));
            //log.debug('account ID check 2', accountId.indexOf("SB"));
            //log.debug('account ID check 3', accountId.indexOf('sb'));
            if (accountId.indexOf("SB") > 0){
                return {success: false, message: "Sandbox instance - do not send"}
            }
            var eInvoice = pluginContext.eInvoiceContent;
            var eInvoiceFile = file.create({
                name: 'eInvoiceFile.xml',
                fileType: file.Type.XMLDOC,
                contents: eInvoice
            });
            var tokenHeader = {
                Content_Type: 'application/x-www-form-urlencoded'
            }
            var tokenBody = {
                grant_type: 'client_credentials',
                client_id: '798601e0-0612-4206-8045-992174ac2fd8',
                client_secret: '0e049b53-2403-4d49-b08a-53477508217d',
                scope: 'eui',
                vendor_api_key: '91ce253f-e7bf-4ba8-be92-19b4ec57ead1'
            }
            var secretKey = https.post({
                url: 'https://ax.maventa.com/oauth2/token',
                headers: tokenHeader,
                body: tokenBody
            });
            var accessToken = JSON.parse(secretKey.body);
            accessToken = "Bearer "+accessToken.access_token;
            var files = [
                { name: 'file', value: eInvoiceFile }, // file cabinet ids; you can use dynamic files
            ];
            var headerObj = {
                Authorization: accessToken,
                //Content_Type: 'multipart/form-data',
                accept: 'application/json'
            };
            var resp = multiPartUpload_1.uploadParts('https://ax.maventa.com/v1/invoices', headerObj, files);

            // var response = https.post({
            //     url: 'https://ax.maventa.com/v1/invoices',
            //     body: {file: eInvoice},
            //     headers: headerObj
            // });
            log.debug('resp', resp);
            if (resp.code == 201){
                var respBody = JSON.parse(resp.body);
                return {success: true, message: "Response Code: " + resp.code + ' - Doc Number: ' + respBody.number + ' - Recipient EIA: ' + respBody.recipient.eia + ' - Recipient Name: ' + respBody.recipient.name + ' - Sum with Tax: ' + respBody.sum_tax}
            } else {
                return {success: false, message: "Response Code: " + resp.code + ' - ' + resp.body}
            }

        }

        return {
            send: send
        };
    });