import sys
import pandas as pd
import io

def main():
    operation = sys.argv[1] if len(sys.argv) > 1 else "head"
    input_data = sys.stdin.read()
    df = pd.read_csv(io.StringIO(input_data))

    try:
        if operation == "head":
            output = df.head().to_string()
        elif operation == "tail":
            output = df.tail().to_string()
        elif operation == "describe":
            output = df.describe().to_string()
        elif operation == "info":
            buffer = io.StringIO()
            df.info(buf=buffer)
            output = buffer.getvalue()
        else:
            output = f"Unknown operation: {operation}"
    except Exception as e:
        output = f"Error: {str(e)}"

    print(output)

if __name__ == '__main__':
    main()
