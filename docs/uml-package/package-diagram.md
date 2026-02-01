# Biểu đồ Phụ thuộc Gói (Package Dependency Diagram)

```plantuml
@startuml
title Biểu đồ Phụ thuộc Gói
skinparam packageStyle rectangle
skinparam shadowing false
hide circle

' Định nghĩa các tầng (Layers)
package "Tầng Giao diện" as L1 {
    package "Giao diện Ứng dụng" as ui
}

package "Tầng Chức năng" as L2 {
    package "Chức năng Học Mới (Discovery)" as list_learn
    package "Chức năng Ôn Tập (Review)" as list_review
    package "Chức năng Chat" as chat
    package "Chức năng Thống kê" as analytics
}

package "Tầng Nghiệp vụ" as L3 {
    package "Nghiệp vụ SRS" as srs
    package "Nghiệp vụ Nội dung" as content
}

package "Tầng Hạ tầng" as L4 {
    package "Thư viện Dùng chung" as shared
    package "Dịch vụ Cơ sở dữ liệu" as db
}

' Mối quan hệ phụ thuộc (Dependency)
' Tuân thủ quy tắc: Tầng trên phụ thuộc tầng dưới, không nhảy tầng, không phụ thuộc ngang.

ui ..> list_learn
ui ..> list_review
ui ..> chat
ui ..> analytics

list_learn ..> content
list_learn ..> srs

list_review ..> srs
list_review ..> content

chat ..> content
analytics ..> srs

srs ..> shared
content ..> shared
srs ..> db
content ..> db

@enduml
```

### Giải thích các quy tắc thiết kế áp dụng:

1.  **Phân tầng rõ ràng**: Các gói được tổ chức thành 4 tầng riêng biệt từ Giao diện xuống Hạ tầng.
2.  **Phụ thuộc một chiều**: Tầng trên sử dụng dịch vụ của tầng ngay bên dưới nó. Ví dụ: Tầng Giao diện gọi xuống Tầng Chức năng.
3.  **Không nhảy tầng**: Giao diện ứng dụng không được phép gọi trực tiếp xuống các dịch vụ Hạ tầng mà phải đi qua các lớp nghiệp vụ và chức năng trung gian.
4.  **Không phụ thuộc vòng hoặc phụ thuộc ngang**: Các gói trong cùng một tầng hoạt động độc lập, không phụ thuộc lẫn nhau để đảm bảo tính module hóa cao và dễ dàng bảo trì.
