'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    SendHorizontal,
    X,
    ExternalLink,
    ChevronRight,
    Sparkles,
    Eye,
    BookOpen,
    Languages,
    Hash,
    Type,
    MessageSquare,
    LogOut,
    ChevronLeft,
    TrendingUp
} from 'lucide-react';

export default function ChatDemo() {
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState<any>(null);

    const openModal = (type: string, char: string, meaning: string, reading: string, explanation: string) => {
        setModalData({ type, char, meaning, reading, explanation });
        setShowModal(true);
    };

    const recentChats = [
        { id: 1, title: 'Dùng te kư dâ sai ntn?', preview: 'Cách nói làm ơn trong tiếng Nhật...', time: '11:50 PM', type: 'GRAMMAR', active: false },
        { id: 2, title: 'Chữ nichi là gì nhỉ?', preview: 'Cái chữ hình ô vuông có gạch...', time: '11:36 PM', type: 'KANJI', active: true },
        { id: 3, title: 'Sense viết ntn vậy?', preview: 'Cách viết chữ tiên sinh...', time: '10:15 PM', type: 'VOCAB', active: false },
        { id: 4, title: 'Bộ có 3 dấu phẩy...', preview: 'À đó là bộ Thủy đấy bạn...', time: '09:20 PM', type: 'KANJI', active: false },
        { id: 5, title: 'Nihon hay Nippon?', preview: 'Cả hai đều đúng nhưng mà...', time: 'Yesterday', type: 'VOCAB', active: false },
        { id: 6, title: 'Sao nhiều bộ thủ thế :(', preview: 'Đừng lo, Hanachan sẽ giúp...', time: 'Yesterday', type: 'GENERAL', active: false },
    ];

    return (
        <div className="flex h-full bg-[#FFFDFD] overflow-hidden rounded-[32px] border border-[#F0E0E0] shadow-sm">
            {/* Sub-sidebar for Recent Chats */}
            <aside className="w-72 border-r border-[#F0E0E0] flex flex-col shrink-0 bg-white/50 backdrop-blur-sm">
                <div className="p-6">
                    <Link
                        href="/demo-v2/dashboard"
                        className="w-full py-4 mb-6 border-2 border-[#F0E0E0] text-[#A0AEC0] hover:text-[#3E4A61] hover:border-[#3E4A61]/20 rounded-[20px] font-black text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 bg-white"
                    >
                        <ChevronLeft size={16} />
                        RETURN TO DASHBOARD
                    </Link>

                    <button className="w-full py-4 bg-[#FFB5B5] hover:bg-[#FFC5C5] text-white rounded-[20px] font-black text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#FFB5B5]/30 transition-all active:scale-95">
                        <Plus size={18} />
                        NEW CHAT
                    </button>
                </div>

                <div className="px-5 flex-1 overflow-y-auto custom-scrollbar">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBD5E0] mb-5 px-3">History</h3>
                    <div className="space-y-3 pb-8">
                        {recentChats.map((chat) => (
                            <div
                                key={chat.id}
                                className={`p-4 rounded-[20px] border transition-all cursor-pointer flex gap-3 ${chat.active
                                    ? 'bg-white border-[#F0E0E0] shadow-xl shadow-[#3E4A61]/5 ring-1 ring-[#FFB5B5]/20'
                                    : 'bg-transparent border-transparent hover:bg-white hover:border-[#F0E0E0]'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${chat.active ? 'bg-[#FFF5F5] border-[#FFDADA] text-[#FFB5B5]' : 'bg-[#F7FAFC] border-[#EDF2F7] text-[#A0AEC0]'
                                    }`}>
                                    {chat.type === 'GRAMMAR' ? <Languages size={14} /> :
                                        chat.type === 'KANJI' ? <Hash size={14} /> :
                                            chat.type === 'VOCAB' ? <Type size={14} /> : <MessageSquare size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-[#3E4A61] truncate">{chat.title}</p>
                                    <p className="text-[9px] text-[#A0AEC0] font-bold truncate tracking-tight">{chat.preview}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Chat Interface */}
            <main className="flex-1 flex flex-col relative bg-white">
                <header className="h-16 border-b border-[#F0E0E0] flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-[#FFB5B5] rounded-full animate-pulse" />
                        <div>
                            <h2 className="text-xl font-black text-[#3E4A61] tracking-tighter">HANACHAN</h2>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar pb-32">
                    {/* Kanji Scenario - Natural */}
                    <div className="flex flex-col items-end gap-2 max-w-lg ml-auto">
                        <div className="bg-[#3E4A61] text-white px-6 py-4 rounded-[24px] rounded-tr-none shadow-lg text-sm font-medium leading-relaxed">
                            Chữ nichi hình ô vuông có gạch ở giữa là chữ gì bạn nhỉ?
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 max-w-xl">
                        <div className="bg-[#F7FAFC] border border-[#F0E0E0] rounded-[32px] rounded-tl-none p-8 shadow-sm space-y-6">
                            <p className="text-[#3E4A61] text-[14px] leading-relaxed font-medium">
                                À, chữ đó là chữ **Nhật (日)** bạn nhé! Nó tượng trưng cho mặt trời hoặc ngày. Bạn sẽ thấy nó rất nhiều trong các chữ như "Nihon" (Japan) hay "Mainichi" (Hàng ngày) đó.
                            </p>
                            <div className="border-t border-[#EDF2F7] pt-6 space-y-3">
                                <h4 className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest flex items-center gap-2">Referenced Content</h4>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => openModal('KANJI', '日', 'Mặt trời, Ngày', 'にち・ひ', 'Chữ Kanji cơ bản tượng trưng cho mặt trời.')} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F0E0E0] hover:border-[#FFB5B5] rounded-xl text-[10px] font-black uppercase text-[#FF6B6B] tracking-wider transition-all shadow-sm active:scale-95">
                                        <Eye size={12} /> <span>日 • SUN</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grammar Scenario - Natural */}
                    <div className="flex flex-col items-end gap-2 max-w-lg ml-auto">
                        <div className="bg-[#3E4A61] text-white px-6 py-4 rounded-[24px] rounded-tr-none shadow-lg text-sm font-medium leading-relaxed">
                            Dùng te kư dâ sai ntn vậy?
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 max-w-xl">
                        <div className="bg-[#F7FAFC] border border-[#F0E0E0] rounded-[32px] rounded-tl-none p-8 shadow-sm space-y-6">
                            <p className="text-[#3E4A61] text-[14px] leading-relaxed font-medium">
                                Có phải ý bạn là cấu trúc **~てください (~te kudasai)** không? Mẫu này dùng để đưa ra lời yêu cầu lịch sự đó. Bạn chỉ cần chia động từ sang thể Te rồi cộng với "kudasai" là xong.
                            </p>
                            <p className="text-[11px] font-bold text-[#A0AEC0] italic leading-tight">
                                * Lưu ý: Giải thích ngữ pháp này do AI tự khởi tạo, chưa nằm trong giáo trình chính thức.
                            </p>
                            <div className="border-t border-[#EDF2F7] pt-6 space-y-3">
                                <h4 className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest flex items-center gap-2">Referenced Content</h4>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => openModal('GRAMMAR', '～てください', 'Làm ơn...', 'Verb (Te-form) + ください', 'Dùng cho các yêu cầu lịch sự.')} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F0E0E0] hover:border-[#FFB5B5] rounded-xl text-[10px] font-black uppercase text-[#FF6B6B] tracking-wider transition-all shadow-sm">
                                        <Eye size={12} /> <span>～てください • REQUEST</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Radical Scenario - Descriptive */}
                    <div className="flex flex-col items-end gap-2 max-w-lg ml-auto">
                        <div className="bg-[#3E4A61] text-white px-6 py-4 rounded-[24px] rounded-tr-none shadow-lg text-sm font-medium leading-relaxed">
                            Cái bộ có 3 dấu phẩy đứng ở bên trái tên là gì ấy nhờ
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 max-w-xl">
                        <div className="bg-[#F7FAFC] border border-[#F0E0E0] rounded-[32px] rounded-tl-none p-8 shadow-sm space-y-6">
                            <p className="text-[#3E4A61] text-[14px] leading-relaxed font-medium">
                                À, đó chính là bộ **Thủy (氵)**, hay còn gọi là "sanzui" đó bạn! Nó tượng trưng cho nước nên bạn sẽ thấy nó trong các chữ liên quan đến chất lỏng như 海 (Biển) hay 泳 (Bơi).
                            </p>
                            <div className="border-t border-[#EDF2F7] pt-6 space-y-3">
                                <h4 className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest flex items-center gap-2">Referenced Content</h4>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => openModal('RADICAL', '氵', 'Nước', 'さんずい', 'Bộ thủ tượng trưng cho nước.')} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F0E0E0] hover:border-[#FFB5B5] rounded-xl text-[10px] font-black uppercase text-[#FF6B6B] tracking-wider transition-all shadow-sm">
                                        <Eye size={12} /> <span>氵 • WATER</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vocab Scenario - Vietnamese */}
                    <div className="flex flex-col items-end gap-2 max-w-lg ml-auto">
                        <div className="bg-[#3E4A61] text-white px-6 py-4 rounded-[24px] rounded-tr-none shadow-lg text-sm font-medium leading-relaxed">
                            Nihon có phải là Nhật Bản ko Hanachan?
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 max-w-xl">
                        <div className="bg-[#F7FAFC] border border-[#F0E0E0] rounded-[32px] rounded-tl-none p-8 shadow-sm space-y-6">
                            <p className="text-[#3E4A61] text-[14px] leading-relaxed font-medium">
                                Đúng rồi bạn! **日本 (Nihon/Nippon)** chính là "Nhật Bản". Chữ này ghép từ Nhật (Mặt trời) và Bản (Gốc), có nghĩa là "Gốc của mặt trời" hay "Đất nước mặt trời mọc" đó.
                            </p>
                            <div className="border-t border-[#EDF2F7] pt-6 space-y-3">
                                <h4 className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest flex items-center gap-2">Referenced Content</h4>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => openModal('VOCAB', '日本', 'Nhật Bản', 'にほん・にっぽん', 'Tên gọi của nước Nhật.')} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F0E0E0] hover:border-[#FFB5B5] rounded-xl text-[10px] font-black uppercase text-[#FF6B6B] tracking-wider transition-all shadow-sm">
                                        <Eye size={12} /> <span>日本 • JAPAN</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vocab Comparison - Casual */}
                    <div className="flex flex-col items-end gap-2 max-w-lg ml-auto">
                        <div className="bg-[#3E4A61] text-white px-6 py-4 rounded-[24px] rounded-tr-none shadow-lg text-sm font-medium leading-relaxed">
                            Sensei với kyoushi khác gì nhau vậy, t thấy toàn dịch là giáo viên mà
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 max-w-xl">
                        <div className="bg-[#F7FAFC] border border-[#F0E0E0] rounded-[32px] rounded-tl-none p-8 shadow-sm space-y-6">
                            <p className="text-[#3E4A61] text-[14px] leading-relaxed font-medium">
                                Câu hỏi hay lắm! **Sensei (先生)** dùng để gọi trực tiếp giáo viên hoặc bác sĩ (giống như cách tôn xưng). Còn **Kyoushi (教師)** là danh từ chỉ nghề nghiệp. Bạn gọi thầy là "Sensei", nhưng khi nói về công việc của mình thì dùng "Kyoushi".
                            </p>
                            <div className="border-t border-[#EDF2F7] pt-6 space-y-3">
                                <h4 className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest flex items-center gap-2">Referenced Content</h4>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => openModal('VOCAB', '先生', 'Giáo viên', 'せんせい', 'Tôn xưng cho những người có kiến thức.')} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F0E0E0] hover:border-[#FFB5B5] rounded-xl text-[10px] font-black uppercase text-[#FF6B6B] tracking-wider transition-all shadow-sm">
                                        <Eye size={12} /> <span>先生 • SENSEI</span>
                                    </button>
                                    <button onClick={() => openModal('VOCAB', '教師', 'Giáo viên', 'きょうし', 'Danh từ chỉ nghề dạy học.')} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F0E0E0] hover:border-[#FFB5B5] rounded-xl text-[10px] font-black uppercase text-[#FF6B6B] tracking-wider transition-all shadow-sm">
                                        <Eye size={12} /> <span>教師 • KYOUSHI</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Context Memory Scenario - 3 Turns */}
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#F0E0E0]"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-[#FFFDFD] px-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">New Session: Context Memory Demo</span>
                        </div>
                    </div>

                    {/* Turn 1 */}
                    <div className="flex flex-col items-end gap-2 max-w-lg ml-auto">
                        <div className="bg-[#3E4A61] text-white px-6 py-4 rounded-[24px] rounded-tr-none shadow-lg text-sm font-medium leading-relaxed">
                            Chữ "Sơn" núi viết thế nào ấy bạn?
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 max-w-xl">
                        <div className="bg-[#F7FAFC] border border-[#F0E0E0] rounded-[32px] rounded-tl-none p-8 shadow-sm space-y-6">
                            <p className="text-[#3E4A61] text-[14px] leading-relaxed font-medium">
                                Chữ **Sơn (山)** đây nhé! Nó trông giống hệt 3 ngọn núi đứng cạnh nhau luôn. Bạn có muốn xem cách viết chi tiết không?
                            </p>
                            <div className="border-t border-[#EDF2F7] pt-6 space-y-3">
                                <h4 className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest flex items-center gap-2">Referenced Content</h4>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => openModal('KANJI', '山', 'Núi', 'さん・やま', 'Chữ Kanji tượng hình cho ngọn núi.')} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F0E0E0] hover:border-[#FFB5B5] rounded-xl text-[10px] font-black uppercase text-[#FF6B6B] tracking-wider transition-all shadow-sm">
                                        <Eye size={12} /> <span>山 • MOUNTAIN</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Turn 2 */}
                    <div className="flex flex-col items-end gap-2 max-w-lg ml-auto">
                        <div className="bg-[#3E4A61] text-white px-6 py-4 rounded-[24px] rounded-tr-none shadow-lg text-sm font-medium leading-relaxed">
                            Thế còn chữ Sông (kawa) thì sao?
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 max-w-xl">
                        <div className="bg-[#F7FAFC] border border-[#F0E0E0] rounded-[32px] rounded-tl-none p-8 shadow-sm space-y-6">
                            <p className="text-[#3E4A61] text-[14px] leading-relaxed font-medium">
                                Còn chữ **Sông (川 - Xuyên)** thì đơn giản hơn, chỉ có 3 nét dọc như dòng nước chảy thôi. Cả hai chữ Sơn và Xuyên đều là những chữ tượng hình cơ bản nhất đấy!
                            </p>
                            <div className="border-t border-[#EDF2F7] pt-6 space-y-3">
                                <h4 className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest flex items-center gap-2">Referenced Content</h4>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => openModal('KANJI', '川', 'Sông', 'せん・かわ', 'Chữ Kanji tượng hình cho dòng sông.')} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F0E0E0] hover:border-[#FFB5B5] rounded-xl text-[10px] font-black uppercase text-[#FF6B6B] tracking-wider transition-all shadow-sm">
                                        <Eye size={12} /> <span>川 • RIVER</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Turn 3 - Demonstrating Memory */}
                    <div className="flex flex-col items-end gap-2 max-w-lg ml-auto">
                        <div className="bg-[#3E4A61] text-white px-6 py-4 rounded-[24px] rounded-tr-none shadow-lg text-sm font-medium leading-relaxed">
                            Nếu ghép 2 chữ đó lại thì đọc kiểu gì và nghĩa là gì nhỉ?
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 max-w-xl">
                        <div className="bg-[#F7FAFC] border border-[#F0E0E0] rounded-[32px] rounded-tl-none p-8 shadow-sm space-y-6">
                            <p className="text-[#3E4A61] text-[14px] leading-relaxed font-medium">
                                Nếu bạn ghép chữ **Sơn (山)** và **Xuyên (川)** mà chúng mình vừa nói đến lại với nhau, ta sẽ được từ **山川 (Yamakawa)**. Nó có nghĩa là "Núi và Sông", thường được dùng trong văn chương để chỉ phong cảnh thiên nhiên hùng vĩ đó!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-[#F0E0E0]">
                    <div className="max-w-2xl mx-auto relative group">
                        <input
                            type="text"
                            placeholder="Ask about Japanese..."
                            className="w-full py-4 pl-6 pr-16 bg-[#F7FAFC] border-2 border-[#EDF2F7] rounded-2xl outline-none focus:border-[#FFB5B5] focus:bg-white transition-all text-sm font-medium"
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#3E4A61] text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                            <SendHorizontal size={20} />
                        </button>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {showModal && modalData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-[#3E4A61]/60 backdrop-blur-[8px]" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white w-full max-w-xl rounded-[48px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-8 pb-0 flex justify-between items-start">
                            <div className="flex gap-2">
                                <span className="px-4 py-1.5 bg-[#FFF5F5] text-[#FFB5B5] text-[9px] font-black uppercase tracking-widest rounded-xl border border-[#FFDADA]">{modalData.type}</span>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F7FAFC] text-[#CBD5E0] hover:text-[#3E4A61] transition-all border border-[#EDF2F7]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="flex items-center gap-8">
                                <div className="w-32 h-32 bg-white border border-[#F0E0E0] rounded-[40px] flex items-center justify-center shadow-inner">
                                    <span className="text-7xl font-black text-[#FFB5B5] leading-none">{modalData.char}</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest">Meaning</p>
                                        <h3 className="text-3xl font-black text-[#3E4A61] tracking-tighter">{modalData.meaning}</h3>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest">Reading</p>
                                        <p className="text-xl font-black text-[#3E4A61]/80">{modalData.reading}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-[#F7FAFC] border border-[#F0E0E0] rounded-[24px] text-xs font-bold text-[#3E4A61]/70 leading-relaxed">
                                {modalData.explanation}
                            </div>
                        </div>
                        <div className="p-8 pt-0 flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-[#F7FAFC] rounded-[20px] text-[10px] font-black uppercase text-[#A0AEC0]">CLOSE</button>
                            <Link href="/demo-v2/content/kanji/1" className="flex-[2] py-4 bg-[#FFB5B5] text-white rounded-[20px] text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg">
                                <ExternalLink size={16} /> OPEN FULL PAGE
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
