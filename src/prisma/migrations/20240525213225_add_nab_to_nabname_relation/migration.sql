-- AddForeignKey
ALTER TABLE "nabs_names" ADD CONSTRAINT "nabs_names_nab_id_fkey" FOREIGN KEY ("nab_id") REFERENCES "nabs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
