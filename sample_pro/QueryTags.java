import java.sql.*;
public class QueryTags {
    public static void main(String[] args) throws Exception {
        Class.forName("org.postgresql.Driver");
        Connection c = DriverManager.getConnection(
            "jdbc:postgresql://192.168.1.59:5432/gumgu", "postgres", "ezat6695");
        Statement s = c.createStatement();
        ResultSet r = s.executeQuery(
            "SELECT equip_id, trend_name, tag_name, col_name " +
            "FROM tb_temp_tag " +
            "WHERE enabled = 1 " +
            "  AND equip_id NOT IN ('2420M011') " +
            "  AND ( " +
            "    trend_name ILIKE '%침탄%PV%' OR trend_name ILIKE '%유조%PV%' OR " +
            "    trend_name ILIKE '%CP%PV%'   OR trend_name ILIKE '%C3H8%'   OR " +
            "    tag_name   ILIKE '%침탄%PV%' OR tag_name   ILIKE '%유조%PV%' OR " +
            "    tag_name   ILIKE '%CP%PV%'   OR tag_name   ILIKE '%C3H8%' " +
            "  ) " +
            "ORDER BY equip_id, trend_name");
        System.out.printf("%-15s %-30s %-30s %-30s%n", "equip_id", "trend_name", "tag_name", "col_name");
        System.out.println("-".repeat(110));
        while (r.next()) {
            System.out.printf("%-15s %-30s %-30s %-30s%n",
                r.getString(1), r.getString(2), r.getString(3), r.getString(4));
        }
        c.close();
    }
}
