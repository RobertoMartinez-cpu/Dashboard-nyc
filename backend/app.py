from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuración de conexión a MySQL
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',          # Cambia si tu usuario es diferente
    'password': '1234', # Coloca tu contraseña de MySQL
    'database': 'nyc_dashboard',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db():
    return pymysql.connect(
        host=os.getenv('gateway01.us-east-1.prod.aws.tidbcloud.com', 'localhost'),
        user=os.getenv('2Kvta8dwg25Rg7B.root', 'root'),
        password=os.getenv('Tiw3Wowv6iJinVQx', '1234'),
        database=os.getenv('sys', 'nyc_dashboard'),
        port=int(os.getenv('4000', 3306)),
        cursorclass=pymysql.cursors.DictCursor
    )


@app.route('/api/viajes', methods=['GET'])
def get_viajes():
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id_viaje, zona_origen_id, monto_tarifa, estado_viaje, DATE_FORMAT(fecha_registro, '%Y-%m-%d %H:%i') AS fecha FROM viajes ORDER BY id_viaje DESC LIMIT 50;")
            registros = cursor.fetchall()
        return jsonify(registros), 200
    finally:
        conn.close()

@app.route('/api/metricas', methods=['GET'])
def get_metricas():
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            # 1. KPIs Generales
            cursor.execute("""
                SELECT 
                    COUNT(*) AS total_viajes,
                    IFNULL(ROUND(AVG(monto_tarifa), 2), 0) AS tarifa_promedio,
                    IFNULL(SUM(CASE WHEN estado_viaje = 'cancelado' THEN 1 ELSE 0 END), 0) AS viajes_cancelados
                FROM viajes;
            """)
            kpis = cursor.fetchone()

            # 2. Agregación para el gráfico: Conteo por zona
            cursor.execute("""
                SELECT zona_origen_id, COUNT(*) AS total
                FROM viajes
                GROUP BY zona_origen_id
                ORDER BY total DESC
                LIMIT 5;
            """)
            distribucion_zonas = cursor.fetchall()

        return jsonify({
            'kpis': kpis,
            'distribucion_zonas': distribucion_zonas
        }), 200
    finally:
        conn.close()

@app.route('/api/viajes', methods=['POST'])
def add_viaje():
    data = request.get_json()
    zona = data.get('zona_origen_id')
    tarifa = data.get('monto_tarifa')
    estado = data.get('estado_viaje', 'completado')

    # Validación de backend
    if not zona or not tarifa:
        return jsonify({'error': 'Faltan campos obligatorios'}), 400
    try:
        zona = int(zona)
        tarifa = float(tarifa)
        if zona <= 0 or tarifa <= 0:
            raise ValueError()
    except ValueError:
        return jsonify({'error': 'Zona y tarifa deben ser números positivos'}), 400

    conn = get_db()
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO viajes (zona_origen_id, monto_tarifa, estado_viaje) VALUES (%s, %s, %s)"
            cursor.execute(sql, (zona, tarifa, estado))
            conn.commit()
        return jsonify({'mensaje': 'Viaje registrado con éxito'}), 201
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)