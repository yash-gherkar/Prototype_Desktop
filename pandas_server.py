# pandas_server.py
import sys
import json
import pandas as pd
import os

def read_file(file_path):
    if file_path.endswith('.csv'):
        return pd.read_csv(file_path)
    elif file_path.endswith('.xlsx'):
        return pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file type.")

def run_command(df, command, args):
    if command == 'head':
        return df.head(int(args.get('n', 5))).to_dict(orient='records')
    elif command == 'tail':
        return df.tail(int(args.get('n', 5))).to_dict(orient='records')
    elif command == 'describe':
        return df.describe().to_dict()
    elif command == 'info':
        info = {
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "shape": df.shape
        }
        return info
    else:
        return {"error": "Unknown command."}

def main():
    try:
        data = json.load(sys.stdin)
        file_path = data['filePath']
        command = data['command']
        args = data.get('args', {})

        df = read_file(file_path)
        result = run_command(df, command, args)
        print(json.dumps(result))
        sys.stdout.flush()
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.stdout.flush()

if __name__ == '__main__':
    main()
