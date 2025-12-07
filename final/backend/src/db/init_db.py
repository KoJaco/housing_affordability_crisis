"""Initialize SQLite database from schema file."""
import sqlite3
from pathlib import Path


def init_database(db_path: str = "src/db/database.sqlite", schema_path: str = "src/db/schema.sql"):
    """
    Initialize SQLite database from schema file.
   
    Args:
        db_path: Path to SQLite database file
        schema_path: Path to schema SQL file
    """
    # Convert to Path objects for easier handling
    db_path_obj = Path(db_path)
    schema_path_obj = Path(schema_path)
    
    # Create database directory if it doesn't exist
    db_path_obj.parent.mkdir(parents=True, exist_ok=True)
    
    # Remove existing database if it exists (for fresh start)
    if db_path_obj.exists():
        print(f"Removing existing database at {db_path_obj}")
        db_path_obj.unlink()
    
    # Read schema file
    if not schema_path_obj.exists():
        raise FileNotFoundError(f"Schema file not found: {schema_path_obj}")
    
    print(f"Reading schema from {schema_path_obj}")
    with open(schema_path_obj, 'r', encoding="utf-8") as f:
        schema_sql = f.read()
    
    # Connect to database
    print(f"Creating database at {db_path_obj}")
    conn = sqlite3.connect(str(db_path_obj))
    cursor = conn.cursor()
    
    # Execute schema SQL
    # Use executescript for multi-statement execution, but we'll do it manually
    # to handle CREATE TABLE before CREATE INDEX
    # Split by semicolon, but preserve multi-line statements
    statements = []
    current_statement = []
    
    for line in schema_sql.split('\n'):
        stripped = line.strip()
        # Skip comments and empty lines
        if not stripped or stripped.startswith('--'):
            continue
        
        current_statement.append(line)
        
        # If line ends with semicolon, we have a complete statement
        if stripped.endswith(';'):
            statement = '\n'.join(current_statement).strip()
            if statement:
                statements.append(statement.rstrip(';'))
            current_statement = []
    
    # Add any remaining statement (in case file doesn't end with semicolon)
    if current_statement:
        statement = '\n'.join(current_statement).strip()
        if statement:
            statements.append(statement.rstrip(';'))
    
    create_table_statements = []
    create_index_statements = []
    
    # Separate CREATE TABLE and CREATE INDEX statements
    for statement in statements:
        statement = statement.strip()
        if not statement:
            continue
        statement_upper = statement.upper()
        if 'CREATE TABLE' in statement_upper:
            create_table_statements.append(statement)
        elif 'CREATE INDEX' in statement_upper:
            create_index_statements.append(statement)
    
    # Execute CREATE TABLE statements first
    print(f"  Creating {len(create_table_statements)} tables...")
    for i, statement in enumerate(create_table_statements, 1):
        try:
            # Debug: print first 100 chars of statement
            print(f"    Executing CREATE TABLE {i}: {statement[:100]}...")
            cursor.execute(statement)
            print("     Table created successfully.")
        except sqlite3.Error as e:
            print(f"  Error executing CREATE TABLE: {statement[:100]}...")
            print(f"  Error: {e}")
            raise
    
    # Commit tables before creating indexes
    conn.commit()
    
    # Execute CREATE INDEX statements
    print("  Creating indexes...")
    for statement in create_index_statements:
        try:
            cursor.execute(statement)
        except sqlite3.Error as e:
            print(f"  Error executing CREATE INDEX: {statement[:50]}...")
            print(f"  Error: {e}")
            raise
    
    # Commit changes
    conn.commit()
    
    # Verify tables were created
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("\nSUCCESS: Database initialized successfully!")
    print(f"  Created tables: {[t[0] for t in tables]}")
    
    # Check indexes
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
    indexes = cursor.fetchall()
    print(f"  Created indexes: {len(indexes)}")
    
    conn.close()
    print(f"\nSUCCESS: Database ready at {db_path_obj.absolute()}")


if __name__ == "__main__":
    import sys
    
    # Allow custom paths via command line
    db_file = sys.argv[1] if len(sys.argv) > 1 else "src/db/database.sqlite"
    schema_file = sys.argv[2] if len(sys.argv) > 2 else "src/db/schema.sql"
    
    init_database()

