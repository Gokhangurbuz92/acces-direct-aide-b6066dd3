import os
import re

handlers_root = 'api/_handlers'

for root, dirs, files in os.walk(handlers_root):
    for file in files:
        if not file.endswith('.js'): continue
        filepath = os.path.join(root, file)

        with open(filepath, 'r') as f:
            content = f.read()

        def replacer(match):
            quote = match.group(1)
            old_path = match.group(2)
            rest = match.group(3)

            # filename inside lib
            lib_file = old_path.split('/lib/')[-1]

            # Correct relative path
            rel_to_lib = os.path.relpath('api/lib', root)
            new_path = os.path.join(rel_to_lib, lib_file)

            # Ensure proper JS path syntax
            if not new_path.startswith('.'):
                new_path = './' + new_path

            return f"from {quote}{new_path}{quote}"

        # Match: from '.../lib/filename.js'
        # Group 1: quote
        # Group 2: path (must contain /lib/)
        # Group 3: ignored (closed quote matched in f-string)

        # Regex: from (['"])(.*\/lib\/.*)(['"])
        new_content = re.sub(r"from (['\"])(.*\/lib\/.*)(['\"])", replacer, content)

        if new_content != content:
            print(f"Fixing {filepath}")
            with open(filepath, 'w') as f:
                f.write(new_content)
