CREATE DATABASE GestionMantenimiento;
GO
USE GestionMantenimiento;
GO

CREATE TABLE Roles (
    IdRol INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Usuarios (
    IdUsuario INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Usuario NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    IdRol INT NOT NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (IdRol) REFERENCES Roles(IdRol)
);

CREATE TABLE Maquinas (
    IdMaquina INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(50) NOT NULL UNIQUE,
    Nombre NVARCHAR(150) NOT NULL,
    Ubicacion NVARCHAR(150) NULL,
    Descripcion NVARCHAR(500) NULL,
    Activa BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE TiposMantenimiento (
    IdTipoMantenimiento INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(80) NOT NULL UNIQUE,
    Activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE Prioridades (
    IdPrioridad INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    Nivel INT NOT NULL UNIQUE
);

CREATE TABLE EstadosTicket (
    IdEstado INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Tickets (
    IdTicket BIGINT IDENTITY(1,1) PRIMARY KEY,
    NumeroTicket AS ('MT-' + RIGHT('000000' + CAST(IdTicket AS VARCHAR(6)), 6)) PERSISTED,
    IdUsuario INT NOT NULL,
    IdMaquina INT NOT NULL,
    IdTipoMantenimiento INT NOT NULL,
    IdPrioridad INT NOT NULL,
    IdEstado INT NOT NULL,
    FechaInicio DATETIME2 NOT NULL,
    FechaFin DATETIME2 NULL,
    TrabajoRealizado NVARCHAR(500) NULL,
    Observaciones NVARCHAR(MAX) NULL,
    FechaCreacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FechaActualizacion DATETIME2 NULL,
    CONSTRAINT FK_Tickets_Usuarios FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario),
    CONSTRAINT FK_Tickets_Maquinas FOREIGN KEY (IdMaquina) REFERENCES Maquinas(IdMaquina),
    CONSTRAINT FK_Tickets_Tipos FOREIGN KEY (IdTipoMantenimiento) REFERENCES TiposMantenimiento(IdTipoMantenimiento),
    CONSTRAINT FK_Tickets_Prioridades FOREIGN KEY (IdPrioridad) REFERENCES Prioridades(IdPrioridad),
    CONSTRAINT FK_Tickets_Estados FOREIGN KEY (IdEstado) REFERENCES EstadosTicket(IdEstado),
    CONSTRAINT CK_Tickets_Fechas CHECK (FechaFin IS NULL OR FechaFin >= FechaInicio)
);

CREATE TABLE FotosTicket (
    IdFoto BIGINT IDENTITY(1,1) PRIMARY KEY,
    IdTicket BIGINT NOT NULL,
    NombreArchivo NVARCHAR(255) NOT NULL,
    RutaArchivo NVARCHAR(500) NOT NULL,
    TipoFoto NVARCHAR(30) NULL,
    FechaCreacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Fotos_Tickets FOREIGN KEY (IdTicket) REFERENCES Tickets(IdTicket) ON DELETE CASCADE
);

CREATE INDEX IX_Tickets_Usuario ON Tickets(IdUsuario);
CREATE INDEX IX_Tickets_Maquina ON Tickets(IdMaquina);
CREATE INDEX IX_Tickets_FechaInicio ON Tickets(FechaInicio);
CREATE INDEX IX_Tickets_Estado ON Tickets(IdEstado);

INSERT INTO Roles (Nombre) VALUES ('ADMIN'), ('SUPERVISOR'), ('MECANICO');
INSERT INTO TiposMantenimiento (Nombre) VALUES ('Preventivo'), ('Correctivo'), ('Emergencia'), ('Inspección');
INSERT INTO Prioridades (Nombre, Nivel) VALUES ('Baja',1), ('Media',2), ('Alta',3), ('Crítica',4);
INSERT INTO EstadosTicket (Nombre) VALUES ('En proceso'), ('Finalizado'), ('Pendiente'), ('Cancelado');

INSERT INTO Maquinas (Codigo, Nombre, Ubicacion, Descripcion)
VALUES ('MAQ-001','Máquina de prueba','Taller','Registro inicial para pruebas');
GO
