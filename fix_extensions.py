import os
import re

handlers_root = 'api/_handlers'

for root, dirs, files in os.walk(handlers_root):
    for file in files:
        if not file.endswith('.js'): continue
        filepath = os.path.join(root, file)

        with open(filepath, 'r') as f:
            content = f.read()

        def fix_extension(match):
            quote = match.group(1)
            path = match.group(2)
            quote2 = match.group(3)

            if not path.endswith('.js') and not path.endswith('.json'):
                path += '.js'

            return f"from {quote}{path}{quote2}"

        # Regex to find relative imports
        new_content = re.sub(r"from (['\"])([\.][\w\-\/\.]+)(['\"])", fix_extension, content)

        if new_content != content:
            print(f"Adding extensions in {filepath}")
            with open(filepath, 'w') as f:
                f.write(new_content)
