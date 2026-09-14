/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * Merged Sales Order User Event for selected workflow-to-script conversions.
 */
define(['N/log', 'N/record', 'N/runtime', './tgc_lib', './tgc_lib_common'], (
    log,
    record,
    runtime,
    lib,
    common
) => {
    function beforeLoad(context) {
        try {
            const salesOrder = context.newRecord;

            setFormEntryTime(salesOrder);
            applyCustomerCustomDeliveryPricing(context, salesOrder);
        } catch (e) {
            log.error({
                title: 'tgc_ue_wftosalesorder beforeLoad',
                details: formatError(e)
            });
        }
    }

    function beforeSubmit(context) {
        try {
            const salesOrder = context.newRecord;

            common.roundLineQuantities(salesOrder);
            applyDefaultGmPrecision(salesOrder);
            applyDniOrdersWithoutPoNumber(salesOrder);
            applyEngineerOrderPendingApproval(context, salesOrder);
            applyMissingFgasPendingApproval(context, salesOrder);
        } catch (e) {
            log.error({
                title: 'tgc_ue_wftosalesorder beforeSubmit',
                details: formatError(e)
            });
        }
    }

    function afterSubmit(context) {
        try {
            applyDniCardOnlyCylinderCharges(context);
        } catch (e) {
            log.error({
                title: 'tgc_ue_wftosalesorder afterSubmit',
                details: formatError(e)
            });
        }
    }

    function setFormEntryTime(salesOrder) {
        common.setBodyValue(
            salesOrder,
            lib.FIELDS.TRANSACTION.START_FORM_ENTRY_TIME,
            new Date()
        );
    }

    function applyCustomerCustomDeliveryPricing(context, salesOrder) {
        const form = context.form;
        const customerId = salesOrder.getValue({
            fieldId: lib.FIELDS.TRANSACTION.CUSTOMER
        });
        const createdFrom = salesOrder.getValue({
            fieldId: lib.FIELDS.TRANSACTION.CREATED_FROM
        });
        const shipVia = salesOrder.getValue({
            fieldId: lib.FIELDS.TRANSACTION.SHIP_VIA
        });

        if (customerId) {
            applySendViaCarrierDisplay(form, customerId);
            applyDefaultShipVia(salesOrder, customerId, createdFrom);
        }

        if (String(shipVia) !== lib.VALUES.SHIP_VIA.SAMEDAY) {
            common.setBodyValue(
                salesOrder,
                lib.FIELDS.TRANSACTION.AUTO_DELIVERY_PRICE,
                true
            );
        }

        if (createdFrom) {
            applyCreatedFromAutoDeliveryPrice(salesOrder, createdFrom);
        }
    }

    function applySendViaCarrierDisplay(form, customerId) {
        if (!form || !customerId) {
            return;
        }

        const currentUser = runtime.getCurrentUser();
        const customerFields = common.lookupCustomerFields(customerId, [
            lib.FIELDS.CUSTOMER.SALES_REP,
            lib.FIELDS.CUSTOMER.DO_NOT_SEND_ORDERS_VIA_CARRIER
        ]);

        const doNotSendViaCarrier = common.isTruthy(
            customerFields[lib.FIELDS.CUSTOMER.DO_NOT_SEND_ORDERS_VIA_CARRIER]
        );
        const salesRepId = common.getSelectValue(customerFields[lib.FIELDS.CUSTOMER.SALES_REP]);

        const canEditSendViaCarrier =
            !doNotSendViaCarrier ||
            String(currentUser.id) === String(salesRepId) ||
            String(currentUser.id) === lib.VALUES.USER.CHRIS_TAME ||
            String(currentUser.role) === lib.VALUES.ROLE.ADMINISTRATOR;

        if (canEditSendViaCarrier) {
            return;
        }

        common.disableField(form, lib.FIELDS.TRANSACTION.SEND_VIA_CARRIER);
    }

    function applyDefaultShipVia(salesOrder, customerId, createdFrom) {
        if (!customerId || createdFrom) {
            return;
        }

        const defaultDeliveryOption = salesOrder.getValue({
            fieldId: lib.FIELDS.TRANSACTION.DEFAULT_DELIVERY_OPTION
        });

        if (defaultDeliveryOption) {
            common.setBodyValue(
                salesOrder,
                lib.FIELDS.TRANSACTION.SHIP_VIA,
                defaultDeliveryOption
            );
        }
    }

    function applyCreatedFromAutoDeliveryPrice(salesOrder, createdFromId) {
        const createdFromFields = common.lookupFields(
            lib.RECORD_TYPES.TRANSACTION,
            createdFromId,
            [
                'type',
                lib.FIELDS.TRANSACTION.AUTO_DELIVERY_PRICE
            ]
        );

        const createdFromType = common.getSelectText(createdFromFields.type);
        const createdFromAutoDeliveryPrice =
            createdFromFields[lib.FIELDS.TRANSACTION.AUTO_DELIVERY_PRICE];

        if (createdFromAutoDeliveryPrice === false || createdFromType === 'Quotation') {
            common.setBodyValue(
                salesOrder,
                lib.FIELDS.TRANSACTION.AUTO_DELIVERY_PRICE,
                false
            );
        }
    }

    function applyDefaultGmPrecision(salesOrder) {
        const onSiteTime = salesOrder.getValue({
            fieldId: lib.FIELDS.TRANSACTION.ON_SITE_TIME
        });
        const offSiteTime = salesOrder.getValue({
            fieldId: lib.FIELDS.TRANSACTION.OFF_SITE_TIME
        });

        if (common.isOneHourApart(onSiteTime, offSiteTime)) {
            common.setBodyValue(
                salesOrder,
                lib.FIELDS.TRANSACTION.SHIP_VIA,
                lib.VALUES.SHIP_VIA.GMPRECISION
            );
        }
    }

    function applyDniOrdersWithoutPoNumber(salesOrder) {
        const poRequired = salesOrder.getValue({
            fieldId: lib.FIELDS.TRANSACTION.CUSTOMER_PO_REQUIRED
        });
        const poNumber = salesOrder.getValue({
            fieldId: lib.FIELDS.TRANSACTION.PO_CHECK_NUMBER
        });

        if (common.isTruthy(poRequired) && !poNumber) {
            common.setBodyValue(salesOrder, lib.FIELDS.TRANSACTION.DNI, true);
        }
    }

    function applyEngineerOrderPendingApproval(context, salesOrder) {
        const orderByContactPermission = salesOrder.getValue({
            fieldId: lib.FIELDS.TRANSACTION.ORDER_BY_CONTACT_PERMISSION
        });
        const currentRole = String(runtime.getCurrentUser().role);

        const needsContactApproval =
            String(orderByContactPermission) === lib.VALUES.CONTACT_PERMISSION.ENGINEER_NEEDS_APPROVAL;
        const isEngineerWithoutAuthority =
            currentRole === lib.VALUES.ROLE.GM_ENGINEER_WITHOUT_AUTHORITY;

        if (!needsContactApproval && !isEngineerWithoutAuthority) {
            return;
        }

        common.setPendingApproval(
            salesOrder,
            lib.VALUES.PENDING_REASON.ENGINEER_ORDERED
        );
    }

    function applyMissingFgasPendingApproval(context, salesOrder) {
        if (!common.isCreate(context)) {
            return;
        }

        if (common.hasFgasItem(salesOrder)) {
            common.setPendingApproval(
                salesOrder,
                lib.VALUES.PENDING_REASON.FGAS_INVALID
            );
        }
    }

    function applyDniCardOnlyCylinderCharges(context) {
        if (!common.isCreate(context)) {
            return;
        }

        const salesOrder = context.newRecord;
        const customerId = salesOrder.getValue({
            fieldId: lib.FIELDS.TRANSACTION.CUSTOMER
        });
        const orderType = salesOrder.getValue({
            fieldId: lib.FIELDS.TRANSACTION.ORDER_TYPE
        });

        if (!customerId || !common.isCylinderOrderType(orderType)) {
            return;
        }

        const customerFields = common.lookupCustomerFields(customerId, [
            lib.FIELDS.CUSTOMER.ENTITY_STATUS
        ]);
        const customerStatusId = common.getSelectValue(
            customerFields[lib.FIELDS.CUSTOMER.ENTITY_STATUS]
        );

        if (String(customerStatusId) !== lib.VALUES.CUSTOMER_STATUS.EXISTING_CARD_ONLY) {
            return;
        }

        common.submitSalesOrderFields(record, salesOrder.id, {
            [lib.FIELDS.TRANSACTION.DNI]: true
        });
    }

    function formatError(e) {
        return {
            name: e.name,
            message: e.message,
            stack: e.stack
        };
    }

    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit
    };
});
