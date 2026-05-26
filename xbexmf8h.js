const exposes = require('zigbee-herdsman-converters/lib/exposes');
const e = exposes;
const ea = exposes.access;

let seq = 0;
const nextSeq = () => (seq = (seq + 1) & 0xFFFF);

const getBytes = (d) => {
    if (!d) return [];
    if (d.type === 'Buffer' && d.data) return d.data;
    if (Buffer.isBuffer(d)) return Array.from(d);
    if (Array.isArray(d)) return d;
    return [d];
};

const definition = {
    fingerprint: [{modelID: 'TS130F', manufacturerName: '_TZE20C_xbexmf8h'}],
    model: 'TS130F_xbexmf8h',
    vendor: 'Tuya',
    description: 'Blind/curtain motor controller',
    fromZigbee: [{
        cluster: 'manuSpecificTuya',
        type: [
            'commandDataReport',
            'commandGetData',
            'commandSetDataResponse',
            'commandActiveStatusReport',
            'commandActiveStatusReportAlt',
        ],
        convert: (model, msg, publish, options, meta) => {
            try {
                const result = {};
                if (!msg.data || !msg.data.dpValues) return result;
                for (const dpv of msg.data.dpValues) {
                    const dp = dpv.dp;
                    const bytes = getBytes(dpv.data);
                    if (dp === 1) {
                        result.state  = ({0: 'OPEN', 1: 'STOP', 2: 'CLOSE'})[bytes[0]];
                        result.moving = ({0: 'UP',   1: 'STOP', 2: 'DOWN'})[bytes[0]];
                    } else if (dp === 2) {
                        result.position = (bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3]);
                    } else if (dp === 3) {
                        result.calibration = bytes[0] === 0 ? 'ON' : 'OFF';
                    } else if (dp === 8) {
                        result.motor_reversal = bytes[0] === 1 ? 'ON' : 'OFF';
                    } else if (dp === 10) {
                        const raw = (bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3]);
                        result.calibration_time = raw / 10;
                    } else if (dp === 14) {
                        result.backlight_mode = bytes[0] === 0 ? 'ON' : 'OFF';
                    }
                }
                return result;
            } catch(err) {
                return {};
            }
        },
    }],
    toZigbee: [{
        key: ['state', 'position', 'motor_reversal', 'calibration', 'backlight_mode'],
        convertSet: async (entity, key, value, meta) => {
            const opts = {disableDefaultResponse: true};
            if (key === 'state') {
                const map = {OPEN:0, open:0, STOP:1, stop:1, CLOSE:2, close:2};
                const val = map[value];
                if (val !== undefined) {
                    await entity.command('manuSpecificTuya', 'dataRequest',
                        {seq: nextSeq(), dpValues: [{dp: 1, datatype: 4, data: [val]}]}, opts);
                    return {state: {state: value.toUpperCase()}};
                }
            } else if (key === 'position') {
                const pos = Math.min(100, Math.max(0, Math.round(Number(value))));
                await entity.command('manuSpecificTuya', 'dataRequest',
                    {seq: nextSeq(), dpValues: [{dp: 2, datatype: 2,
                        data: [(pos>>24)&0xFF,(pos>>16)&0xFF,(pos>>8)&0xFF,pos&0xFF]}]}, opts);
                return {state: {position: pos}};
            } else if (key === 'motor_reversal') {
                const val = (value === 'ON' || value === true) ? 1 : 0;
                await entity.command('manuSpecificTuya', 'dataRequest',
                    {seq: nextSeq(), dpValues: [{dp: 8, datatype: 4, data: [val]}]}, opts);
                return {state: {motor_reversal: value}};
            } else if (key === 'calibration') {
                const val = (value === 'ON' || value === true) ? 0 : 1;
                await entity.command('manuSpecificTuya', 'dataRequest',
                    {seq: nextSeq(), dpValues: [{dp: 3, datatype: 4, data: [val]}]}, opts);
                return {state: {calibration: value}};
            } else if (key === 'backlight_mode') {
                const val = (value === 'ON' || value === true) ? 0 : 1;
                await entity.command('manuSpecificTuya', 'dataRequest',
                    {seq: nextSeq(), dpValues: [{dp: 14, datatype: 4, data: [val]}]}, opts);
                return {state: {backlight_mode: value}};
            }
        },
    }],
    exposes: [
        e.cover().withPosition(),
        e.enum('moving', ea.STATE, ['UP', 'STOP', 'DOWN'])
            .withDescription('Dirección de movimiento actual'),
        e.numeric('calibration_time', ea.STATE)
            .withUnit('s')
            .withValueStep(0.1)
            .withDescription('Tiempo de recorrido medido en la última calibración')
            .withCategory('diagnostic'),
        e.binary('motor_reversal', ea.ALL, 'ON', 'OFF')
            .withDescription('Invierte el sentido del motor')
            .withCategory('config'),
        e.binary('calibration', ea.ALL, 'ON', 'OFF')
            .withDescription('Modo calibración')
            .withCategory('config'),
        e.binary('backlight_mode', ea.ALL, 'ON', 'OFF')
            .withDescription('Luz de fondo del interruptor')
            .withCategory('config'),
    ],
};

module.exports = definition;