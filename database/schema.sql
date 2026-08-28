-- Creación de la base de datos (para entorno local)
CREATE DATABASE IF NOT EXISTS nyc_dashboard;
USE nyc_dashboard;

-- Creación de la tabla con tipos de datos estrictos e indexación
CREATE TABLE IF NOT EXISTS viajes (
    id_viaje INT AUTO_INCREMENT PRIMARY KEY,
    zona_origen_id INT NOT NULL,
    monto_tarifa DECIMAL(8, 2) NOT NULL,
    estado_viaje VARCHAR(20) DEFAULT 'completado',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_zona (zona_origen_id),
    INDEX idx_estado (estado_viaje)
);

-- Registros semilla (Seed Data) para pruebas iniciales y visualización
INSERT INTO viajes (zona_origen_id, monto_tarifa, estado_viaje) VALUES
(79, 250.50, 'completado'),
(79, 180.00, 'completado'),
(132, 450.00, 'completado'),
(132, 520.00, 'completado'),
(230, 95.00, 'cancelado'),
(230, 310.20, 'completado'),
(79, 140.00, 'en_curso'),
(48, 85.50, 'completado');