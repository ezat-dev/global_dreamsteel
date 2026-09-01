package com.sample_pro.controller.monitor;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

//http://localhost:8080/sample_pro/plc/mits/read?start=10000&count=50
//http://localhost:8080/sample_pro/plc/mits/writeTest?address=10000&value=777
@Controller
@RequestMapping("/plc/mits")
public class MitsubishiController {

	private static final String CSHARP_API_URL = "http://localhost:5050";

    private final RestTemplate restTemplate = new RestTemplate();

    // 읽기  GET  /sample_pro/plc/mits/read?start=10000&count=4
    @RequestMapping(value = "/read", method = RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<?> read(
            @RequestParam(value = "start", defaultValue = "10000") int start,
            @RequestParam(value = "count", defaultValue = "4") int count
    ) {
        if (count < 1) count = 1;
        if (count > 300) count = 300;

        try {
            String url = CSHARP_API_URL + "/api/plc/read?start=" + start + "&count=" + count;
            Map<?, ?> resp = restTemplate.getForObject(url, Map.class);
            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", "MITSUBISHI READ 실패: " + e.getMessage());
            return ResponseEntity.ok(err);
        }
    }

    // 쓰기  POST /sample_pro/plc/mits/write   body: {"address":10000,"value":123}
    @RequestMapping(value = "/write", method = RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<?> write(@RequestBody Map<String, Object> body) {
        try {
            String url = CSHARP_API_URL + "/api/plc/write";
            Map<?, ?> resp = restTemplate.postForObject(url, body, Map.class);
            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", "MITSUBISHI WRITE 실패: " + e.getMessage());
            return ResponseEntity.ok(err);
        }
    }
    
    
    
    
    
    @RequestMapping(value = "/writeTest", method = RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<?> writeTest(
            @RequestParam("address") int address,
            @RequestParam("value") int value) {

        try {
            String url = CSHARP_API_URL + "/api/plc/write";

            Map<String, Object> body = new HashMap<>();
            body.put("address", address);
            body.put("value", value);

            Map<?, ?> resp = restTemplate.postForObject(url, body, Map.class);

            return ResponseEntity.ok(resp);

        } catch (Exception e) {

            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", e.getMessage());

            return ResponseEntity.ok(err);
        }
    }
}