# PR Checklist (Evidence-based Labels)

Silakan isi blok JSON di bawah secara jujur dan akurat. Action hanya menambahkan label jika ada evidensi eksplisit dari blok ini, label issue yang direferensikan, atau pemetaan path file.

```json
{
  "work_type": "",            // "bug" | "feature" | "improvement" | "chore" | "docs" | "design" | "research"
  "priority": "",             // "p0" | "p1" | "p2" | "p3"
  "severity": "",             // "s1" | "s2" | "s3" | "s4" (khusus bug)
  "size": "",                 // "xs" | "s" | "m" | "l" | "xl"
  "area": [],                  // contoh: ["security","compliance"]
  "environment": "",          // "prod" | "staging" | "dev"
  "platform": "",             // "web" | "backend" | "mobile"
  "risk": "",                 // "high" | "medium" | "low"
  "impact": "",               // "blocker" | "high" | "medium" | "low"
  "story_points": "",         // "1" | "2" | "3" | "5" | "8" | "13"
  "release": "",              // contoh: "v2.6.0"
  "blocked": false             // true/false
}
```

Referensi issue yang ditutup (opsional, akan menyalin label issue ke PR):  
Gunakan kata kunci: Fixes #123, Closes #456, Resolves #789

Catatan: Action tidak menghapus label yang ada dan tidak melakukan inferensi di luar evidensi.
