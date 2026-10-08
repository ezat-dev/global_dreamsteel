package com.mes.service.scada;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.mes.common.exception.BusinessException;
import com.mes.common.exception.ErrorCode;

/**
 * 트렌드 화면의 [엑셀 받기]·[트렌드 저장] 파일을 서버 폴더에도 한 부 남긴다. DB는 건드리지 않는다.
 *
 * <p>
 * 파일은 화면(브라우저)이 만든다 — 엑셀은 SheetJS, 그림은 Highcharts가 그린 것이다.
 * 화면은 같은 파일을 누른 PC로 내려받고, 그 바이트를 그대로 여기로 보낸다. 서버가 따로
 * 다시 만들지 않으므로 PC에 받은 파일과 서버 사본이 똑같다.
 * </p>
 *
 * <p>
 * 폴더는 application.yml의 {@code scada.trend-file.excel-dir / image-dir}
 * (기본 D:/온도데이터/엑셀 내려받기, D:/온도데이터/트렌드 저장).
 * </p>
 *
 * <p>
 * 파일 이름은 화면이 정한 이름(트렌드_20261008_1000-20261008_1100.xlsx)을 그대로 쓴다 —
 * 폴더를 열어 봤을 때 언제 것인지 이름만으로 알아야 하기 때문이다(알람 첨부처럼 UUID로
 * 바꾸지 않는 이유). 대신 경로 부분과 윈도우가 못 쓰는 글자를 걷어내고, 같은 이름이 이미
 * 있으면 덮어쓰지 않고 "(2)"처럼 번호를 붙인다 — 같은 구간을 두 번 받는 일은 흔하고,
 * 앞의 것을 지우면 안 된다.
 * </p>
 *
 * <p>
 * 확장자만 보지 않고 파일 첫 바이트도 확인한다(xlsx는 ZIP이라 "PK\3\4", PNG는 8바이트 표식).
 * </p>
 */
@Component
public class TrendFileStorage {

    private static final Logger log = LoggerFactory.getLogger(TrendFileStorage.class);

    public static final String KIND_EXCEL = "excel";
    public static final String KIND_IMAGE = "image";

    private static final byte[] MAGIC_ZIP = { 0x50, 0x4B, 0x03, 0x04 };
    private static final byte[] MAGIC_PNG = { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };

    /** 확장자를 뺀 이름의 최대 길이. 윈도우 경로 260자 제한에 폴더 경로·"(999)"가 더해져도 들어가게 */
    private static final int BASE_MAX = 150;

    /** 같은 이름이 이만큼 쌓이면 더 붙이지 않고 실패로 알린다(사실상 일어나지 않는다) */
    private static final int SUFFIX_MAX = 999;

    /** 윈도우가 파일 이름으로 받지 않는 장치 이름 */
    private static final Set<String> RESERVED = Set.of(
            "CON", "PRN", "AUX", "NUL",
            "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
            "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9");

    private final Path excelDir;
    private final Path imageDir;

    public TrendFileStorage(@Value("${scada.trend-file.excel-dir}") String excelDir,
            @Value("${scada.trend-file.image-dir}") String imageDir) {
        this.excelDir = Paths.get(excelDir).toAbsolutePath().normalize();
        this.imageDir = Paths.get(imageDir).toAbsolutePath().normalize();
    }

    /**
     * 종류에 맞는 파일인지 확인하고 그 종류의 폴더에 저장한다.
     *
     * @param kind "excel" 또는 "image"
     * @return 실제로 저장한 파일 이름 — 같은 이름이 있었으면 "(2)" 등이 붙은 이름
     */
    public String save(String kind, MultipartFile file) {
        boolean excel = KIND_EXCEL.equals(kind);
        if (!excel && !KIND_IMAGE.equals(kind)) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "파일 종류는 excel 또는 image여야 합니다.");
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "파일이 비어 있습니다.");
        }

        String ext = excel ? "xlsx" : "png";
        byte[] head = readHead(file);
        if (!ext.equals(extensionOf(file.getOriginalFilename()))
                || !startsWith(head, excel ? MAGIC_ZIP : MAGIC_PNG)) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER,
                    excel ? "엑셀(.xlsx) 파일만 저장할 수 있습니다." : "PNG 그림만 저장할 수 있습니다.");
        }

        Path dir = excel ? excelDir : imageDir;
        String base = cleanBase(file.getOriginalFilename(), ext);
        try {
            Files.createDirectories(dir);
            /*
             * 빈 이름을 찾아 쓴다. 있는지 먼저 보고 쓰면 그 사이에 다른 요청이 같은 이름을 쓸 수
             * 있으므로, REPLACE 없이 바로 써 보고 이미 있으면(FileAlreadyExistsException) 다음 번호로
             * 넘어간다 — 윈도우에서 이 생성은 원자적이라 둘이 같은 파일을 덮지 않는다.
             */
            for (int n = 1; n <= SUFFIX_MAX; n++) {
                String name = n == 1 ? base + "." + ext : base + "(" + n + ")." + ext;
                Path target = resolve(dir, name);
                try (InputStream in = file.getInputStream()) {
                    Files.copy(in, target);
                    log.info("[트렌드 저장] {} — {}", kind, target);
                    return name;
                } catch (FileAlreadyExistsException e) {
                    // 다음 번호로
                }
            }
        } catch (IOException e) {
            log.error("트렌드 파일 저장 실패: {}/{}", dir, base, e);
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일을 저장하지 못했습니다.");
        }
        log.error("트렌드 파일 저장 실패 — 같은 이름이 {}개를 넘음: {}/{}", SUFFIX_MAX, dir, base);
        throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일을 저장하지 못했습니다.");
    }

    /** 폴더 밖을 가리키면 거부한다 — 이름은 cleanBase를 거쳤지만 한 겹 더 막는다 */
    private static Path resolve(Path dir, String name) {
        Path p = dir.resolve(name).normalize();
        if (!p.startsWith(dir) || p.equals(dir)) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "잘못된 파일 이름입니다.");
        }
        return p;
    }

    /**
     * 화면이 보낸 이름에서 확장자를 뗀 부분을 파일 이름으로 쓸 수 있게 다듬는다.
     * 경로 부분을 떼고(C:\…\a.xlsx로 오는 브라우저도 있다), 윈도우가 못 쓰는 글자를 '_'로 바꾸고,
     * 끝의 점·공백을 지운다(윈도우가 조용히 떼어 버려 다른 이름이 된다).
     */
    static String cleanBase(String original, String ext) {
        String n = original == null ? "" : original;
        n = n.substring(Math.max(n.lastIndexOf('/'), n.lastIndexOf('\\')) + 1);
        if (n.toLowerCase(Locale.ROOT).endsWith("." + ext)) {
            n = n.substring(0, n.length() - ext.length() - 1);
        }
        n = n.replaceAll("[<>:\"/\\\\|?*\\x00-\\x1F]", "_").trim().replaceAll("[. ]+$", "");
        if (n.length() > BASE_MAX) {
            n = n.substring(0, BASE_MAX);
        }
        if (n.isEmpty()) {
            n = "트렌드";
        }
        if (RESERVED.contains(n.toUpperCase(Locale.ROOT))) {
            n = "_" + n;
        }
        return n;
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
