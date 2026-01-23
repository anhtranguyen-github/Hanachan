# Biểu đồ phụ thuộc gói (Package Dependency Diagram)

```plantuml
@startuml
skinparam packageStyle rectangle
skinparam shadowing false
hide circle

' Định nghĩa các tầng (Layers)
package "Presentation" as L1 {
    package "app_ui" as ui
}

package "Features" as L2 {
    package "learning_feature" as learn
    package "chat_feature" as chat
    package "analytics_feature" as analytics
}

package "Domain" as L3 {
    package "srs_domain" as srs
    package "content_domain" as content
}

package "Infrastructure" as L4 {
    package "shared_lib" as shared
    package "db_service" as db
}

' Mối quan hệ phụ thuộc (Dependency)
' Tuân thủ quy tắc: Tầng trên phụ thuộc tầng dưới, không nhảy tầng, không phụ thuộc ngang.

ui ..> learn
ui ..> chat
ui ..> analytics

learn ..> srs
learn ..> content
chat ..> content
analytics ..> srs

srs ..> shared
content ..> shared
srs ..> db
content ..> db

@enduml
```

### Giải thích các quy tắc thiết kế áp dụng:
1.  **Phân tầng rõ ràng**: Các gói được đặt trong các Layer từ 1 đến 4.
2.  **Phụ thuộc một chiều (Top-down)**: Tầng trên sử dụng dịch vụ của tầng ngay bên dưới nó. Ví dụ: `app_ui` gọi `features`.
3.  **Không nhảy tầng**: Giao diện (`ui`) không gọi trực tiếp xuống hạ tầng (`db`) mà phải đi qua các tầng trung gian.
4.  **Không phụ thuộc vòng/ngang**: Các gói trong cùng một tầng (như `learning_feature` và `chat_feature`) hoạt động độc lập, không phụ thuộc lẫn nhau để đảm bảo tính module hóa cao.
