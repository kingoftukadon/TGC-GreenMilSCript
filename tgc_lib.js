/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 *
 * Reusable object library for workflow-to-Sales Order User Event conversion.
 */
define([], () => {
    const RECORD_TYPES = {
        SALES_ORDER: 'salesorder',
        CUSTOMER: 'customer',
        TRANSACTION: 'transaction',
        ITEM: 'item'
    };

    const SUBLISTS = {
        ITEM: 'item'
    };

    const FIELDS = {
        TRANSACTION: {
            CUSTOMER: 'entity',
            CREATED_FROM: 'createdfrom',
            DNI: 'custbody4',
            ORDER_STATUS: 'orderstatus',
            ORDER_TYPE: 'custbodygms_ordertype',
            PO_CHECK_NUMBER: 'otherrefnum',
            PENDING_APPROVAL_REASON: 'custbody_so_pending_reason',
            SHIP_VIA: 'shipmethod',
            START_FORM_ENTRY_TIME: 'custbody_start_form_entry_time',
            ON_SITE_TIME: 'custbodytime_on_site',
            OFF_SITE_TIME: 'custbodytime_off_site',
            SEND_VIA_CARRIER: 'custbody_send_via_carrier',
            AUTO_DELIVERY_PRICE: 'custbody_auto_delivery_price',
            DEFAULT_DELIVERY_OPTION: 'custbody_default_delivery_option',
            CUSTOMER_PO_REQUIRED: 'custbody_customer_po_required_before_invoicing',
            ORDER_BY_CONTACT_PERMISSION: 'custbody_order_by_contact'
        },
        ITEM: {
            ITEM: 'item',
            QUANTITY: 'quantity',
            FGAS_ITEM: 'custitem_fgas_item'
        },
        CUSTOMER: {
            ENTITY_STATUS: 'entitystatus',
            SALES_REP: 'salesrep',
            DO_NOT_SEND_ORDERS_VIA_CARRIER: 'custentity_do_not_send_orders_via_carrier'
        }
    };

    const VALUES = {
        ORDER_STATUS: {
            PENDING_APPROVAL: 'A'
        },
        ORDER_TYPE: {
            CYLINDER_CHARGE: '8',
            CYLINDER_RENTALS: '7'
        },
        SHIP_VIA: {
            GMPRECISION: '3',
            SAMEDAY: '5'
        },
        ROLE: {
            ADMINISTRATOR: '3',
            GM_ENGINEER_WITHOUT_AUTHORITY: 'GM_ENGINEER_WITHOUT_AUTHORITY'
        },
        USER: {
            CHRIS_TAME: 'CHRIS_TAME_INTERNAL_ID'
        },
        CUSTOMER_STATUS: {
            EXISTING_CARD_ONLY: 'EXISTING_CARD_ONLY'
        },
        PENDING_REASON: {
            FGAS_INVALID: 'F_GAS_INVALID',
            ENGINEER_ORDERED: 'ENGINEER_ORDERED'
        },
        CONTACT_PERMISSION: {
            ENGINEER_NEEDS_APPROVAL: 'ENGINEER_NO_PRICING_APPROVAL'
        }
    };

    const SEARCHES = {};

    const PARAMETERS = {};

    const EXCLUDED_ITEM_NAMES_FOR_QTY_ROUNDING = [
        'GMRW250V',
        'GMMKT500V',
        'GMRW500V',
        'GMRRS250',
        'GMRRS500'
    ];

    const TIME = {
        ONE_HOUR_IN_MS: 3600000
    };

    return {
        RECORD_TYPES,
        SUBLISTS,
        FIELDS,
        VALUES,
        SEARCHES,
        PARAMETERS,
        EXCLUDED_ITEM_NAMES_FOR_QTY_ROUNDING,
        TIME
    };
});
