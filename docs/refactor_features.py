import os
import re

features_dir = "/Users/rizqynugroho9/workspace/ikki/erp/docs/features"

for filename in os.listdir(features_dir):
    if not filename.endswith(".md"):
        continue
    
    filepath = os.path.join(features_dir, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    # Split the document by headers starting with "## "
    parts = re.split(r'\n## ', content)
    
    new_content = parts[0] # Header
    
    for part in parts[1:]:
        if part.startswith("1. Overview") or part.startswith("Overview"):
            new_content += "\n## 1. Overview\n" + (part.split("\n", 1)[1] if "\n" in part else "")
        elif part.startswith("2. Core Objectives") or part.startswith("Core Objectives"):
            new_content += "\n## 2. Core Objectives\n" + (part.split("\n", 1)[1] if "\n" in part else "")
        elif part.startswith("4. Use Cases") or part.startswith("Use Cases") or part.startswith("3. Use Cases") or "Use Cases" in part.split("\n")[0]:
            new_content += "\n## 3. Use Cases & Workflows\n" + (part.split("\n", 1)[1] if "\n" in part else "")
        elif "Enhancements" in part.split("\n")[0] or "Future" in part.split("\n")[0]:
            new_content += "\n## 4. Recommended Enhancements (Phase 2+)\n" + (part.split("\n", 1)[1] if "\n" in part else "")

    # Clean up multiple newlines
    new_content = re.sub(r'\n{3,}', '\n\n', new_content)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
        
print("Refactored all feature files to strictly follow product template.")
