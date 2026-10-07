package com.mes.service.scada;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Locale;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.mes.common.exception.BusinessException;
import com.mes.common.exception.ErrorCode;

/**
 * 알람 첨부 파일(PDF·사진)을 서버 폴더에 두고 꺼내는 일만 한다. DB는 건드리지 않는다.
 *
 * <p>
 * 폴더는 application.yml의 {@code scada.alarm-file.dir}(기본 D:/scada-files/alarm).
 * DB(tb_alarm_tag)에는 이 폴더 안의 파일 이름만 들어간다 — 폴더를 옮기면 설정만 바꾸면 된다.
 * 이 폴더는 백업 대상에 넣어야 한다(DB 백업만으로는 파일이 돌아오지 않는다).
 * </p>
 *
 * <p>
 * 저장 이름은 서버가 정한다(UUID + 확장자). 사용자가 올린 이름 그대로 저장하면 다른 알람의
 * 같은 이름 파일을 덮어쓰고, 이름에 {@code ..\} 같은 것이 섞이면 폴더 밖에 쓸 수도 있다.
 * 원래 이름은 DB의 pdf_name/img_name에 따로 두고 내려받을 때만 쓴다.
 * </p>
 *
 * <p>
 * 확장자만 보지 않고 파일 첫 바이트도 확인한다 — 이름만 .pdf로 바꾼 다른 파일을 막는다.
 * </p>
 */
@Component
public class AlarmFileStorage {

    private static final Logger log = LoggerFactory.getLogger(AlarmFileStorage.class);

    public static final String KIND_PDF = "pdf";
    public static final String KIND_IMG = "img";

    /** 파일 첫머리 표식 — PDF는 "%PDF", JPEG는 FF D8 FF, PNG는 89 50 4E 47 0D 0A 1A 0A */
    private static final byte[] MAGIC_PDF = { 0x25, 0x50, 0x44, 0x46 };
    private static final byte[] MAGIC_JPG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF };
    private static final byte[] MAGIC_PNG = { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };

    /** 원래 이름 칸(pdf_name/img_name)이 VARCHAR(255)다 */
    private static final int NAME_MAX = 255;

    private final Path dir;

    public AlarmFileStorage(@Value("${scada.alarm-file.dir}") String dir) {
        this.dir = Paths.get(dir).toAbsolutePath().normalize();
    }

    /** "pdf" / "img" 말고는 받지 않는다 */
    public static String checkKind(String kind) {
        if (KIND_PDF.equals(kind) || KIND_IMG.equals(kind)) {
            return kind;
        }
        throw new BusinessException(ErrorCode.INVALID_PARAMETER, "파일 종류는 pdf 또는 img여야 합니다.");
    }

    /**
     * 종류에 맞는 파일인지 확인하고 새 이름으로 저장한다.
     *
     * @return 저장한 이름(예: 3f2a…c1.pdf) — DB의 pdf_file/img_file에 넣을 값
     */
    public String save(String kind, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "파일이 비어 있습니다.");
        }
        String ext = extensionOf(file.getOriginalFilename());
        byte[] head = readHead(file);

        String savedExt;
        if (KIND_PDF.equals(kind)) {
            if (!"pdf".equals(ext) || !startsWith(head, MAGIC_PDF)) {
                throw new BusinessException(ErrorCode.INVALID_PARAMETER, "PDF 파일만 올릴 수 있습니다.");
            }
            savedExt = "pdf";
        } else {
            // 확장자와 실제 내용이 같은 종류여야 한다 — .png 이름의 JPEG 같은 것도 받지 않는다
            if (("jpg".equals(ext) || "jpeg".equals(ext)) && startsWith(head, MAGIC_JPG)) {
                savedExt = "jpg";
            } else if ("png".equals(ext) && startsWith(head, MAGIC_PNG)) {
                savedExt = "png";
            } else {
                throw new BusinessException(ErrorCode.INVALID_PARAMETER, "사진은 JPG·PNG만 올릴 수 있습니다.");
            }
        }

        String stored = UUID.randomUUID() + "." + savedExt;
        try {
            Files.createDirectories(dir);
            file.transferTo(resolve(stored));
        } catch (IOException e) {
            log.error("알람 파일 저장 실패: {}", stored, e);
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일을 저장하지 못했습니다.");
        }
        return stored;
    }

    /**
     * 저장 이름 → 실제 경로. 폴더 밖을 가리키면 거부한다 — DB 값은 서버가 넣은 UUID뿐이지만,
     * 누가 DB를 직접 고쳐 경로를 넣어도 폴더 밖 파일을 내주지 않게 한 겹 더 막는다.
     */
    public Path resolve(String stored) {
        Path p = dir.resolve(stored).normalize();
        if (!p.startsWith(dir) || p.equals(dir)) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "잘못된 파일 이름입니다.");
        }
        return p;
    }

    /**
     * 옛 파일 지우기. 실패해도 예외를 던지지 않는다 — DB는 이미 새 값으로 바뀐 뒤라,
     * 여기서 실패를 알리면 화면은 실패로 보이는데 실제로는 바뀐 상태가 된다.
     * 남은 파일은 폴더에 쓰레기로 남을 뿐이고 로그로 알 수 있다.
     */
    public void deleteQuietly(String stored) {
        if (stored == null || stored.isBlank()) {
            return;
        }
        try {
            Files.deleteIfExists(resolve(stored));
        } catch (Exception e) {
            log.warn("알람 파일 삭제 실패(그대로 남음): {} — {}", stored, e.getMessage());
        }
    }

    /** 저장 이름의 확장자로 내려줄 형식을 정한다 */
    public static String contentTypeOf(String stored) {
        String ext = extensionOf(stored);
        return switch (ext) {
            case "pdf" -> "application/pdf";
            case "png" -> "image/png";
            default -> "image/jpeg";
        };
    }

    /**
     * 사용자가 올린 이름을 DB에 넣을 모양으로 — 경로 부분을 떼고(브라우저에 따라 C:\…\사진.jpg로
     * 오기도 한다) 255자를 넘으면 자른다. 비어 있으면 대신 쓸 이름을 준다.
     */
    public static String cleanOriginalName(String name, String fallback) {
        String n = name == null ? "" : name;
        n = n.substring(Math.max(n.lastIndexOf('/'), n.lastIndexOf('\\')) + 1).trim();
        if (n.isEmpty()) {
            n = fallback;
        }
        return n.length() > NAME_MAX ? n.substring(n.length() - NAME_MAX) : n;
    }

    private static String extensionOf(String name) {
        if (name == null) {
            return "";
        }
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static byte[] readHead(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            return in.readNBytes(MAGIC_PNG.length);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "파일을 읽지 못했습니다.");
        }
    }

    private static boolean startsWith(byte[] head, byte[] magic) {
        return head.length >= magic.length && Arrays.equals(Arrays.copyOf(head, magic.length), magic);
    }
}
