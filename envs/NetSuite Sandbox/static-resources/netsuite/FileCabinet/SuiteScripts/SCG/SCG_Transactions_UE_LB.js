// noinspection SpellCheckingInspection

/**
 *
 * Library file to hold common functions supporting transactions
 *
 * @author Andrew Hadfield - SaaS Consulting Group
 *
 * @NApiVersion 2.1
 */
define(['N/search', 'N/record', 'N/format', 'N/render'], (search, record, format, render) => {
	const RECURR_SUBSCR_REV_ACCT = 'Recurring Subscription (On-Prem Term License) Revenue';//'661'
	const SAAS_REVENUE_ACCT = 'SaaS Revenue';//'662'
	const ORDER_TYPE_RENEWAL = '3';

	function printInvoiceHtml(invc) {
		try {
			const lineCount = invc.getLineCount({ sublistId: 'item'});
			const orderType = invc.getValue('custbody_so_ordertype');
			const printExpanded = invc.getValue('custbody_expand_licenses_on_invoice');
			let printCollapsed = false;
			if (orderType === ORDER_TYPE_RENEWAL && !printExpanded) {
				printCollapsed = true;
			}
			const itemIds = [];
			const itemObj = {};
			for (let i = 0; i < lineCount; i++) {
				const itemType = invc.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
				if (itemType === 'NonInvtPart') {
					const itemId = invc.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
					if (itemIds.indexOf(itemId) < 0) {
						itemIds.push(itemId);
					}
				}
			}
			const filters = [
				search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: itemIds })
			];
			const columns = [
				search.createColumn({ name: 'internalid' }),
				search.createColumn({ name: 'custitem_scg_third_party_commission' })
			];
			const itemSearch = search.create({ type: search.Type.ITEM, filters: filters, columns: columns });
			if (itemIds[0]) {
				const itemResults = itemSearch.run().getRange({ start: 0, end: 1000 });
				for (const itemResult of itemResults) {
					itemObj[itemResult.getValue({ name: 'internalid'})] = itemResult.getValue({ name: 'custitem_scg_third_party_commission' });
				}
			}
			const arrProdFamTaxCode = [];
			const arrProdAmt = [];
			const arrLine = [];
			const arrTpTaxCode = [];
			const arrThirdPtyAmt = [];
			const arrTpLine = [];
			for (let i = 0; i < lineCount; i++) {
				invc.setSublistValue({ sublistId: 'item', fieldId: 'custcol_print_amount', value: null, line: i });
				const bundleName = invc.getSublistValue({ sublistId: 'item', fieldId: 'custcol_bundle_name', line: i });
				if (!isEmpty(bundleName)) {
					continue;
				}
				const prodFamily = invc.getSublistValue({ sublistId: 'item', fieldId: 'custcol_product_family', line: i });
				const incAcct = invc.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ava_incomeaccount', line: i });
				const taxCode = invc.getSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: i });
				const concatProdFamTaxCode = prodFamily + '--' + taxCode;
				const itemId = invc.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
				const itemType = invc.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
				const amount = invc.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
				if (printCollapsed && (incAcct === RECURR_SUBSCR_REV_ACCT || incAcct === SAAS_REVENUE_ACCT)) {
					if (arrProdFamTaxCode.indexOf(concatProdFamTaxCode) < 0) {
						const ind = arrProdFamTaxCode.length || 0;
						arrProdFamTaxCode[ind] = concatProdFamTaxCode;
						arrProdAmt[ind] = parseFloat(amount);
						arrLine[ind] = i;
					}
					else {
						const index = arrProdFamTaxCode.indexOf(concatProdFamTaxCode);
						arrProdAmt[index] += parseFloat(amount);
					}
					continue;
				}
				if (itemType === 'NonInvtPart') {
					const thirdPtyCommItem = itemObj[itemId];
					if (thirdPtyCommItem) {
						const tpTaxCode = invc.getSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: i });
						if (arrTpTaxCode.indexOf(tpTaxCode) < 0) {
							const indTp = arrTpTaxCode.length || 0;
							arrTpTaxCode[indTp] = tpTaxCode;
							arrThirdPtyAmt[indTp] = parseFloat(amount);
							arrTpLine[indTp] = i;
						}
						else {
							const indexTp = arrTpTaxCode.indexOf(tpTaxCode);
							arrThirdPtyAmt[indexTp] += parseFloat(amount);
						}
						continue;
					}
				}
				invc.setSublistValue({ sublistId: 'item', fieldId: 'custcol_print_amount', value: amount, line: i });
			}
			for (let j = 0; j < arrProdFamTaxCode.length; j++) {
				invc.setSublistValue({ sublistId: 'item', fieldId: 'custcol_print_amount', value: arrProdAmt[j], line: arrLine[j] });
			}
			for (let z = 0; z < arrTpTaxCode.length; z++) {
				invc.setSublistValue({ sublistId: 'item', fieldId: 'custcol_print_amount', value: arrThirdPtyAmt[z], line: arrTpLine[z] });
			}
		}
		catch (err) {
			errorLog(err);
		}
	}
	function isInvUpdRecordStatus(invRec){
		let cmFound = 'N';
		let payFound = 'N';
		let jeFound = 'N';
		const filters = [
			search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: invRec.id }),
			search.createFilter({ name: 'payingtransaction', operator: search.Operator.NONEOF, values: '@NONE@' })
		];
		const columns = [
			search.createColumn({ name: 'internalid' }),
			search.createColumn({ name: 'payingtransaction' })
		];
		const invSearch = search.create({ type: search.Type.INVOICE, filters: filters, columns: columns });
		const searchResults = invSearch.run().getRange({ start: 0, end: 1000});
		if (searchResults){
			//log.debug({ title: 'searchReults', details: searchResults });
			for (let i = 0; i < searchResults.length; i++){
				const payTransactionText = searchResults[i].getText('payingtransaction');
				if (payTransactionText.indexOf('Credit Memo') !== -1){
					cmFound = 'Y';
				}
				if (payTransactionText.indexOf('Payment') !== -1){
					payFound = 'Y';
				}
				if (payTransactionText.indexOf('Journal') !== -1){
					jeFound = 'Y';
				}
			}
			//log.debug({ title: 'found', details: `cmFound ${cmFound} payFound ${payFound} jeFound ${jeFound}` });
		}
		let recStatus = '1';//1 = Inv: Open
		if (cmFound === 'Y' && payFound === 'N' && jeFound === 'N'){
			recStatus = '2';//2 = Inv: Credit Applied
		}
		else if (cmFound === 'N' && payFound === 'Y' && jeFound === 'N'){
			recStatus = '3';//3 = Inv: Payment Applied
		}
		else if (cmFound === 'N' && payFound === 'N' && jeFound === 'Y'){
			recStatus = '4';//4 = Inv: Journal Applied
		}
		else if (cmFound === 'Y' && payFound === 'Y' && jeFound === 'N'){
			recStatus = '5';//5 = Inv: Credit and Payment Applied
		}
		else if (cmFound === 'Y' && payFound === 'N' && jeFound === 'Y'){
			recStatus = '6';//6 = Inv: Credit and Journal Applied
		}
		else if (cmFound === 'N' && payFound === 'Y' && jeFound === 'Y'){
			recStatus = '34';//34 = Inv: Payment and Journal Applied
		}
		else if (cmFound === 'Y' && payFound === 'Y' && jeFound === 'Y'){
			recStatus = '35';//35 = Inv: Credit, Payment, and Journal Applied
		}
		const currRecStatus = invRec.getValue('custbody_scg_record_status');
		if (isEmpty(currRecStatus) || currRecStatus !== recStatus){
			invRec.setValue('custbody_scg_record_status', recStatus);
			//log.debug({ title: 'recStatus', details: recStatus });
		}
	}
	function isInvSetDueDate(invoice, term){
		const contrStartDate = invoice.getValue('custbody_contract_start_date');
		if (!isEmpty(contrStartDate)){
			const contrStartDateObj = new Date(contrStartDate);
			const monthToMonth = invoice.getValue('custbody_month_to_month_contract');
			let plus30 = new Date();
			plus30.setDate(plus30.getDate() + 30);
			const plus30Str = format.format({ value: plus30, type: format.Type.DATE });
			const todayPlus30 = format.parse({ value: plus30Str, type: format.Type.DATE });
			if (!monthToMonth){
				invoice.setValue('terms', term);
				if (contrStartDateObj <= plus30)
					invoice.setValue('duedate', todayPlus30);
				else
					invoice.setValue('duedate', contrStartDate);
			}
		}
	}
	function isInvSetToBeEmailedValue(invoice){
		const createdFrom = invoice.getValue('createdfrom');
		if (isEmpty(createdFrom)){
			const custId = invoice.getValue('entity');
			const customerLookup = search.lookupFields({ type: record.Type.CUSTOMER, id: custId, columns: ['custentity_scg_mult_inv_emails']});
			const multEmail = customerLookup.custentity_scg_mult_inv_emails;
			if (multEmail) {
				invoice.setValue('email', multEmail);
				//log.debug({ title: 'isInvSetToBeEmailedValue multEmail', details: multEmail });
			}
		}
	}
	function isInvSetRemittance(invoice){
		const currency = invoice.getValue('currency');
		const subsidiary = invoice.getValue('subsidiary');
		const remittanceRec = getRemittanceRec(subsidiary, currency);
		//log.debug({ title: 'isInvSetRemittance remittanceRec', details: remittanceRec });
		if (remittanceRec){
			invoice.setValue({ fieldId: 'custbody_remittance_information', value: remittanceRec });
		}
	}
	function getRemittanceRec(sub, crrncy){
		let filters = [
			search.createFilter({name: 'isinactive', operator: search.Operator.IS, values: 'F'}),
			search.createFilter({name: 'custrecord_subsidiary', operator: search.Operator.ANYOF, values: sub }),
			search.createFilter({name: 'custrecord_currency', operator: search.Operator.ANYOF, values: crrncy })
		];
		const columns = [
			search.createColumn({name: 'internalid'}),
		];
		let remitSearch = search.create({ type: 'customrecord_remittance_information', filters: filters, columns: columns });
		let result = remitSearch.run().getRange({ start: 0, end: 1 });
		if (!result[0]) {
			log.debug({ title: 'getRemittanceRec no result', details: `sub ${sub} currency ${crrncy}` });
			filters = [
				search.createFilter({name: 'isinactive', operator: search.Operator.IS, values: 'F'}),
				search.createFilter({name: 'custrecord_subsidiary', operator: search.Operator.ANYOF, values: sub }),
				search.createFilter({name: 'custrecord_currency', operator: search.Operator.ANYOF, values: '@NONE@' })
			];
			remitSearch = search.create({ type: 'customrecord_remittance_information', filters: filters, columns: columns });
			result = remitSearch.run().getRange({ start: 0, end: 1 });
		}
		return result[0].getValue({ name: 'internalid'});
	}
	function setPdfBase64(transaction) {
		const pdfFile = render.transaction({entityId: Number(transaction.id), printMode: render.PrintMode.PDF});
		const pdfString = pdfFile.getContents();
		transaction.setValue({ fieldId: 'custbody_pdf_base64_content', value: pdfString});
		//log.debug({ title: 'setPdfBase64', details: transaction.id });
	}
	function isEmpty(stValue) {
		return (stValue === '' || stValue === null || stValue === undefined);
	}
	const errorLog = (e) => {
		let errObj = e;
		if (e instanceof String)
			errObj = JSON.parse(e);

		let errTyp = 'Native JS';
		let errMsg = `Error: ${errObj.name} \n Message: ${errObj.message}`;

		if (errObj.type === 'error.SuiteScriptError') {
			errTyp = 'SuiteScript Error';
			errMsg += `\n ID: ${errObj.id} \n Stack Trace: ${errObj.stack}`;
		}
		else if (errObj.type === 'error.UserEventError') {
			errTyp = 'UserEvent Error';
			errMsg += `\n Event Type: ${errObj.eventType} \n Record ID: ${errObj.recordId} \n ID: ${errObj.id} \n Stack Trace: ${errObj.stack}`;
		}
		log.error({ title: errTyp, details: errMsg });
		return errMsg;
	};
    return {
    	errorLog: errorLog,
		isInvSetRemittance: isInvSetRemittance,
		isInvSetToBeEmailedValue: isInvSetToBeEmailedValue,
		isInvSetDueDate: isInvSetDueDate,
		setPdfBase64: setPdfBase64,
		printInvoiceHtml: printInvoiceHtml,
		isInvUpdRecordStatus: isInvUpdRecordStatus
    };
});
